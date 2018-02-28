const { join } = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');
const { EOL } = require('os');
const program = require('commander');
const spawn = require('cross-spawn');
const inquirer = require('inquirer');
const emoji = require('node-emoji');
const colors = require('./utils/colors');
const { name, version } = require('../package.json');

const cmdDir = fs.realpathSync(process.cwd());
const defaultTemplate = 'a-react-template';

program
  .version(version, '-v, --version')
  .usage('[path] [options]')
  .description('Where [path] is the relative path to the target directory. default: current directory')
  .option('-t, --template [string]', `Template module. default: ${defaultTemplate}.`)
  .option('-f, --force', 'Clear the target directory if not empty.')
  .option('-y, --yes', 'Skip all questions.')
  .on('--help', () => {
    console.log('');
    console.log('  Examples:');
    console.log('');
    console.log('    $ npx create-an-app');
    console.log('    $ npx create-an-app path/to/my-app');
    console.log('');
  })
  .parse(process.argv);

const appDir = program.args && program.args.length ? join(cmdDir, program.args[0]) : cmdDir;
const template = program.template || defaultTemplate;
const { yes } = program;

/**
 *
 * @param {string} relativePath
 */
const resolveAppDir = (relativePath) => {
  try {
    return join(appDir, relativePath);
  } catch (err) {
    throw new Error(err);
  }
};

(async () => {
  const hasYarn = await isYarnInstalled();
  console.log(colors.bold(`${name} v${version}`));
  console.log();

  if (yes) {
    console.log(`Creating an app in ${colors.warn(appDir)} with the template ${colors.warn(template)}`);
    return prepare({ ok: true, useYarn: hasYarn });
  }

  const questions = [
    {
      name: 'ok',
      message: `Create an app in ${colors.warn(appDir)} with the template ${colors.warn(template)}`,
      type: 'confirm',
    },
  ];

  if (hasYarn) {
    questions.push({
      name: 'useYarn',
      message: `Do you want to use ${colors.warn('yarn')} ?`,
      type: 'confirm',
    });
  }

  return inquirer.prompt(questions).then(prepare);
})();

/**
 *
 * @param {*} answers
 */
async function prepare({ ok, useYarn }) {
  if (!ok) return;
  try {
    await throwOnError(fs.ensureDir(appDir));

    if (program.force === true) {
      await throwOnError(fs.emptyDir(appDir));
    }

    const bootstrap = await throwOnError(fs.readdir(appDir))
      .then(appDirFiles => run(useYarn, appDirFiles));

    if (bootstrap && bootstrap.message) {
      throw Error(bootstrap.message);
    }
  } catch (err) {
    console.log(`${colors.error('error')} ${err.message}`);
    console.log();
  }
}

/**
 *
 * @param {boolean} useYarn
 * @param {*} appDirFiles
 */
async function run(useYarn, appDirFiles) {
  if (appDirFiles && appDirFiles.length) {
    throw Error(`${colors.warn(appDir)} is not empty.\nPlease delete it's content or use --force option.`);
  }

  const pkg = {
    name: 'a-new-app',
    version: '0.0.0',
    license: 'MIT',
  };

  const gitignore = [
    'node_modules',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*',
    'dist/',
  ].join('\n');

  const pkgPath = resolveAppDir('package.json');

  await throwOnError(writeJson(pkgPath, pkg));

  console.log();
  logWithPkgEmoji(`Installing ${colors.verbose(template)}`);
  console.log();

  const installTemplate = await install([
    '-D',
    template,
  ], {
    cwd: appDir,
  }, useYarn);
  if (installTemplate !== true) return;

  const templateDir = resolveAppDir(`node_modules/${template}`);
  const resolveTemplateDir = relativePath => join(templateDir, relativePath);
  const {
    files,
    scripts,
    dependencies,
    devDependencies,
  } = require(resolveTemplateDir('package.json'));
  const versionedDeps = versionedDependency(dependencies);
  const versionedDevDeps = versionedDependency(devDependencies);
  const npmScripts = addDescriptionToScripts(Object.keys(scripts), useYarn);

  pkg.scripts = scripts || {};

  if (!(files && files.length)) {
    throw Error([
      `The "files" field seems not defined or empty in the "${template}" package.json`,
      'We use it to create the application file structure.',
      'Related documentation: https://docs.npmjs.com/files/package.json#files',
    ].join('\n'));
  }

  console.log();
  logWithPkgEmoji('Creating the files structure');
  console.log(`${colors.verbose(files.join('\n'))}`);
  console.log(colors.verbose('package.json'));
  console.log(colors.verbose('README.md'));

  await throwOnError(writeJson(pkgPath, pkg));

  const dir = await Promise.all([
    ...files.map((fileName) => {
      const source = resolveTemplateDir(fileName);
      const dest = resolveAppDir(fileName);
      return catchError(fs.copy(source, dest));
    }),
    catchError(writeFile(gitignore, resolveAppDir('.gitignore'))),
    catchError(fs.copy(resolveTemplateDir('README.md'), resolveAppDir('README.md'))),
  ]);
  const failed = dir.filter(result => result && result.message !== undefined);

  if (failed.length) {
    throw Error(failed.map(fail => fail.message).join('\n'));
  }

  console.log(`${colors.info('sucess')} Files were created.`);
  console.log();

  console.log();
  logWithPkgEmoji('Installing dependencies:');
  console.log(`${colors.verbose(versionedDeps.join('\n'))}`);
  console.log();

  const installDeps = await install([
    ...versionedDeps,
  ], {
    cwd: appDir,
  }, useYarn);
  if (installDeps !== true) return;

  console.log();
  logWithPkgEmoji('Installing dev dependencies:');
  console.log(`${colors.verbose(versionedDevDeps.join('\n'))}`);
  console.log();

  const installDevDeps = await install([
    '-D',
    ...versionedDevDeps,
  ], {
    cwd: appDir,
  }, useYarn);
  if (installDevDeps !== true) return;

  console.log();
  logWithEmoji('sparkles', 'Installation complete.');
  console.log(`Do not forget to rename the ${colors.warn('name')} inside the package.json file.`);
  console.log('You can now run these commands inside your application:');
  console.log();
  console.log(npmScripts.map(({ cmd, desc }) =>
    `${colors.debug(cmd)}\n  ${desc}`).join('\n\n'));
  console.log();
}

/**
 *
 * @param {*} scripts
 * @param {boolean} useYarn
 */
function addDescriptionToScripts(scripts, useYarn) {
  return scripts.map((cmd) => {
    const runCmd = useYarn ? 'yarn' : 'npm';
    const script = { cmd: `${runCmd} ${cmd}`, desc: '' };
    switch (cmd) {
      case 'start':
      case 'test':
        if (cmd === 'start') script.desc = 'Start the dev server.';
        if (cmd === 'test') script.desc = 'Run tests.';
        return script;
      case 'start:prod':
      case 'build':
        if (cmd === 'start:prod') script.desc = 'Start the production server.';
        if (cmd === 'build') script.desc = 'Build for production.';
        return { ...script, cmd: `${runCmd}${(!useYarn && ' run') || ''} ${cmd}` };
      default:
        return script;
    }
  });
}

/**
 *
 * @param {string} message
 */
function logWithPkgEmoji(message) {
  logWithEmoji('package', message);
}

/**
 *
 * @param {string} emojiName
 * @param {string} message
 */
function logWithEmoji(emojiName, message) {
  console.log(`${emoji.hasEmoji(emojiName) ? `${emoji.get(emojiName)} ` : '+'} ${message}`);
}

/**
 *
 * @param {*} deps
 */
function versionedDependency(deps) {
  return Object.keys(deps)
    .map(module => `${module}@${deps[module]}`);
}

/**
 *
 * @param {string} path
 * @param {string} content
 */
function writeJson(path, content) {
  return fs.writeJson(path, content, {
    spaces: '  ',
    EOL,
  });
}

/**
 *
 * @param {string} content
 * @param {string} path
 */
function writeFile(content, path) {
  return fs.writeFile(path, content + EOL);
}

/**
 *
 * @param {*} args
 * @param {*} options
 * @param {boolean} useYarn
 */
function install(args, options, useYarn) {
  return promisify((resolve, reject) => {
    const bin = useYarn ? 'yarn' : 'npm';
    const cmd = useYarn ? 'add' : 'install';
    const child = spawn(bin, [
      cmd,
      ...args,
    ], {
      stdio: 'inherit',
      ...options,
    });
    child.on('exit', (code) => {
      if (code !== 0) reject(false);
      resolve(true);
    });
  });
}

function isYarnInstalled() {
  return promisify((resolve, reject) => {
    exec('yarnpkg --version', (error) => {
      if (error) reject(false);
      resolve(true);
    });
  });
}

/**
 *
 * @param {promise} promise
 */
function throwOnError(promise) {
  return promise
    .then(success => success)
    .catch((err) => { throw Error(err); });
}

/**
 *
 * @param {promise} promise
 */
function catchError(promise) {
  return promise
    .then(success => success)
    .catch(err => Error(err));
}

/**
 *
 * @param {*} fn
 */
function promisify(fn) {
  return new Promise(fn)
    .then(success => success)
    .catch(err => err);
}
