const { join } = require('path');
const fs = require('fs-extra');
const { EOL } = require('os');
const program = require('commander');
const inquirer = require('inquirer');
const colors = require('./utils/colors');
const install = require('./utils/install');
const { name, version } = require('../package.json');

const cmdDir = fs.realpathSync(process.cwd());
const defaultTemplate = 'a-react-template';

program
  .version(version, '-v, --version')
  .usage('[path] [options]')
  .description('Where [path] is the relative path to the target directory. default: current directory')
  .option('-t, --template [string]', `Template module. default: ${defaultTemplate}`)
  .option('-f, --force', 'Clear the target directory if not empty')
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

const resolveAppDir = relativePath => join(appDir, relativePath);

inquirer.prompt([
  {
    name: 'ok',
    message: `Create a new application in ${colors.warn(appDir)} with the template ${colors.warn(template)}`,
    type: 'confirm',
  },
]).then(async (answers) => {
  if (!answers.ok) return;
  try {
    await fs.ensureDir(appDir);
    if (program.force === true) {
      await fs.emptyDir(appDir);
    }
    fs.readdir(appDir, run);
  } catch (err) {
    console.log(`${colors.error('error')} ${err.message}`);
    console.log();
  }
});

async function run(err, appDirFiles) {
  if (err) {
    throw new Error(err);
  }

  if (appDirFiles && appDirFiles.length) {
    console.log(`${colors.error('error')} ${colors.warn(appDir)} seems not empty.`);
    console.log('Please remove it\'s content or use --force option.');
    return;
  }

  console.log(colors.bold(`${name} v${version}`));

  const pkgPath = resolveAppDir('package.json');
  const pkg = {
    name: 'a-new-app',
    version: '0.0.0',
    license: 'MIT',
  };

  let writePkg = await writeJson(join('toto', pkgPath), pkg);
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
  });
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
  const npmScripts = addDescriptionToScripts(Object.keys(scripts));

  pkg.scripts = scripts || {};

  if (!(files && files.length)) {
    console.log('');
    console.log(`${colors.error('error')} The "files" field seems not defined or empty in the "${template}" package.json`);
    console.log('We use it to create the application file structure.');
    console.log('Related documentation: https://docs.npmjs.com/files/package.json#files');
    console.log('');
    return;
  }

  console.log();
  console.log('📦  Creating the files structure:');
  console.log(`${colors.verbose(files.join('\n'))}`);
  console.log(colors.verbose('package.json'));
  files.forEach((fileName) => {
    fs.copySync(resolveTemplateDir(fileName), resolveAppDir(fileName));
  });
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
  });
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
  });
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

function addDescriptionToScripts(scripts) {
  return scripts.map((cmd) => {
    let desc = '';
    switch (cmd) {
      case 'start':
        desc = 'Start the local server.';
        break;
      case 'start:prod':
        desc = 'Start the production server.';
        break;
      case 'build':
        desc = 'Bundle the application for production.';
        break;
      case 'test':
        desc = 'Run the tests.';
        break;
      default:
        break;
    }
    return { cmd: `yarn ${cmd}`, desc };
  });
}

function versionedDependency(deps) {
  return Object.keys(deps)
    .map(module => `${module}@${deps[module]}`);
}

function writeJson(path, content) {
  return fs.writeJson(path, content, {
    spaces: '  ',
    EOL,
  }).then(() => true)
    .catch(() => `${colors.error('error')} Could not write ${path}.`);
}
