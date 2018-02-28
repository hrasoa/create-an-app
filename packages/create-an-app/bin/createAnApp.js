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
 * @param relativePath
 * @returns {*}
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
 * @param ok
 * @param useYarn
 */
async function prepare({ ok, useYarn }) {
  if (!ok) return;
  try {
    await canThrow(fs.ensureDir(appDir));

    if (program.force === true) {
      await canThrow(fs.emptyDir(appDir));
    }

    const bootstrap = await canThrow(fs.readdir(appDir))
      .then(appDirFiles => run(useYarn, appDirFiles));

    if (bootstrap && bootstrap.message) {
      throw new Error(bootstrap.message);
    }
  } catch (err) {
    console.log(`${colors.error('error')} ${err.message}`);
    console.log();
  }
}

/**
 *
 * @param appDirFiles
 * @param useYarn
 */
async function run(useYarn, appDirFiles) {
  if (appDirFiles && appDirFiles.length) {
    throw new Error(`${colors.warn(appDir)} is not empty.\nPlease delete it's content or use --force option.`);
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

  await writeJson(pkgPath, pkg);

  console.log();
  logPkg(`Installing ${colors.verbose(template)}`);
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
    throw new Error([
      `The "files" field seems not defined or empty in the "${template}" package.json`,
      'We use it to create the application file structure.',
      'Related documentation: https://docs.npmjs.com/files/package.json#files',
    ].join('\n'));
  }

  console.log();
  logPkg('Creating the files structure');
  console.log(`${colors.verbose(files.join('\n'))}`);
  console.log(colors.verbose('package.json'));
  console.log(colors.verbose('README.md'));

  await writeJson(pkgPath, pkg);

  const dir = await Promise.all([
    ...files.map(async (fileName) => {
      const source = resolveTemplateDir(fileName);
      const dest = resolveAppDir(fileName);
      return catchError(fs.copy(source, dest));
    }),
    catchError(writeFile(gitignore, resolveAppDir('.gitignore'))),
    catchError(fs.copy(resolveTemplateDir('README.md'), resolveAppDir('README.md'))),
  ]);
  const failed = dir.filter(result => result && result.message !== undefined);

  if (failed.length) {
    throw new Error(failed.map(fail => fail.message).join('\n'));
  }

  console.log(`${colors.info('sucess')} Files were created.`);
  console.log();

  console.log();
  logPkg('Installing dependencies:');
  console.log(`${colors.verbose(versionedDeps.join('\n'))}`);
  console.log();

  const installDeps = await install([
    ...versionedDeps,
  ], {
    cwd: appDir,
  }, useYarn);
  if (installDeps !== true) return;

  console.log();
  logPkg('Installing dev dependencies:');
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
 * @param scripts
 * @param useYarn
 * @returns {Array|*}
 */
function addDescriptionToScripts(scripts, useYarn) {
  return scripts.map((cmd) => {
    let desc = '';
    let runCmd = useYarn ? 'yarn' : 'npm';
    switch (cmd) {
      case 'start':
        desc = 'Start the local server.';
        break;
      case 'start:prod':
        desc = 'Start the production server.';
        runCmd = useYarn ? runCmd : `${runCmd} run`;
        break;
      case 'build':
        desc = 'Bundle the application for production.';
        runCmd = useYarn ? runCmd : `${runCmd} run`;
        break;
      case 'test':
        desc = 'Run the tests.';
        break;
      default:
        break;
    }
    return { cmd: `${runCmd} ${cmd}`, desc };
  });
}

/**
 *
 * @param message
 */
function logPkg(message) {
  logWithEmoji('package', message);
}

/**
 *
 * @param emojiName
 * @param message
 */
function logWithEmoji(emojiName, message) {
  console.log(`${emoji.hasEmoji(emojiName) ? emoji.get(emojiName) : '+'}  ${message}`);
}

/**
 *
 * @param deps
 * @returns {Array}
 */
function versionedDependency(deps) {
  return Object.keys(deps)
    .map(module => `${module}@${deps[module]}`);
}

/**
 *
 * @param path
 * @param content
 * @returns {Promise.<boolean>}
 */
function writeJson(path, content) {
  return canThrow(fs.writeJson(path, content, {
    spaces: '  ',
    EOL,
  }));
}

/**
 *
 * @param content
 * @param path
 * @returns {Promise.<boolean>}
 */
function writeFile(content, path) {
  return fs.writeFile(path, content + EOL);
}

/**
 *
 * @param args
 * @param options
 * @param useYarn
 * @returns {Promise.<TResult>}
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

/**
 *
 * @returns {Promise.<TResult>}
 */
function isYarnInstalled() {
  return promisify((resolve, reject) => {
    exec('yarnpkg --version', (error) => {
      if (error) reject(false);
      resolve(true);
    });
  });
}

/**
 * Throws an error
 * @param promise
 * @returns {Promise.<TResult>}
 */
function canThrow(promise) {
  return promise
    .then(success => success)
    .catch((err) => { throw new Error(err); });
}

function catchError(promise) {
  return promise
    .then(success => success)
    .catch(err => new Error(err));
}

/**
 *
 * @param fn
 * @returns {Promise.<TResult>}
 */
function promisify(fn) {
  return new Promise(fn)
    .then(success => success)
    .catch(err => err);
}
