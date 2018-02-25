const { join } = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');
const { EOL } = require('os');
const program = require('commander');
const spawn = require('cross-spawn');
const inquirer = require('inquirer');
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

const resolveAppDir = relativePath => join(appDir, relativePath);

(async () => {
  const hasYarn = await isYarnInstalled();
  console.log();
  console.log(colors.bold(`${name} v${version}`));
  console.log();

  if (yes) {
    console.log(`Creating an app in ${colors.warn(appDir)} with the template ${colors.warn(template)}`);
    prepare({ ok: true, useYarn: hasYarn });
    return;
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

  inquirer.prompt(questions).then(prepare);
})();

async function prepare({ ok, useYarn }) {
  if (!ok) return;
  try {
    await fs.ensureDir(appDir);
    if (program.force === true) {
      await fs.emptyDir(appDir);
    }
    fs.readdir(appDir, (err, appDirFiles) => {
      run(err, appDirFiles, useYarn);
    });
  } catch (err) {
    logError(err.message);
    console.log();
  }
}

async function run(err, appDirFiles, useYarn) {
  if (err) {
    throw new Error(err);
  }

  const pkg = {
    name: 'a-new-app',
    version: '0.0.0',
    license: 'MIT',
  };

  if (appDirFiles && appDirFiles.length) {
    logError(`${colors.warn(appDir)} seems not empty.`);
    console.log('Please remove it\'s content or use --force option.');
    return;
  }

  const pkgPath = resolveAppDir('package.json');

  let writePkg = await writeJson(pkgPath, pkg);
  if (writePkg !== true) {
    console.log(writePkg);
    return;
  }

  console.log();
  console.log(`📦  Installing ${colors.verbose(template)}`);
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
    console.log('');
    logError(`The "files" field seems not defined or empty in the "${template}" package.json`);
    console.log('We use it to create the application file structure.');
    console.log('Related documentation: https://docs.npmjs.com/files/package.json#files');
    console.log('');
    return;
  }

  console.log();
  console.log('📦  Creating the files structure:');
  console.log(`${colors.verbose(files.join('\n'))}`);
  console.log(colors.verbose('package.json'));

  const dir = await Promise.all(files.map(async fileName =>
    copy(resolveTemplateDir(fileName), resolveAppDir(fileName))));
  const failed = dir.filter(file => file !== true);

  if (failed.length) {
    logError('Could not copy these files:');
    console.log(`${colors.verbose(failed.map(({ source }) => source).join('\n'))}`);
    return;
  }

  writePkg = await writeJson(pkgPath, pkg);
  if (writePkg !== true) {
    console.log(writePkg);
    return;
  }

  console.log(`${colors.info('sucess')} Files were created.`);
  console.log();

  console.log();
  console.log('📦  Installing dependencies:');
  console.log(`${colors.verbose(versionedDeps.join('\n'))}`);
  console.log();

  const installDeps = await install([
    ...versionedDeps,
  ], {
    cwd: appDir,
  }, useYarn);
  if (installDeps !== true) return;

  console.log();
  console.log('📦  Installing dev dependencies:');
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
  console.log('✨  Installation complete.');
  console.log(`Do not forget to rename the ${colors.warn('name')} inside the package.json file.`);
  console.log('You can now run these commands inside your application:');
  console.log();
  console.log(npmScripts.map(({ cmd, desc }) =>
    `${colors.debug(cmd)}\n  ${desc}`).join('\n\n'));
  console.log();
}

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
        runCmd = useYarn ? 'yarn' : 'npm run';
        break;
      case 'build':
        desc = 'Bundle the application for production.';
        runCmd = useYarn ? 'yarn' : 'npm run';
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

function logError(message) {
  console.log(`${colors.error('error')} ${message}`);
}

function versionedDependency(deps) {
  return Object.keys(deps)
    .map(module => `${module}@${deps[module]}`);
}

function copy(source, dest) {
  return fs.copy(source, dest)
    .then(() => true)
    .catch(() => ({ source, dest }));
}

function writeJson(path, content) {
  return fs.writeJson(path, content, {
    spaces: '  ',
    EOL,
  }).then(() => true)
    .catch(() => `Could not write ${path}.`);
}

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

function promisify(fn) {
  return new Promise(fn)
    .then(success => success)
    .catch(err => err);
}
