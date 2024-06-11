#!/usr/bin/env node

import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import { program } from 'commander';
import inquirer from 'inquirer';

// Config
const mainFileLocation = 'src/main.jsx';
const mainHybridFileLocation = 'src/mainHybrid.jsx';
const opusUiConfigFileLocation = '.opusUiConfig';
const packageJsonFileLocation = 'package.json';
const indexHtmlFileLocation = 'index.html';

const promptUser = async () => {
	return inquirer.prompt([
		{
			type: 'input',
			name: 'projectName',
			message: 'Enter the project name:',
			validate: input => input ? true : 'Project name cannot be empty',
		},
		{
			type: 'input',
			name: 'projectDescription',
			message: 'Enter the project description (optional):',
			default: '',
		},
		{
			type: 'checkbox',
			name: 'libraries',
			message: 'Which Opus UI libraries would you like to include?',
			choices: [
				"@intenda/opus-ui-components",
				"@intenda/opus-ui-drag-move",
				"@intenda/opus-ui-grid",
				"@intenda/opus-ui-repeater-grid",
				"@intenda/opus-ui-code-editor",
				"@intenda/opus-ui-svg",
				"@intenda/opus-ui-zoom-panner",
				"@intenda/opus-ui-pdf-viewer",
				"@intenda/opus-ui-json-builder",
				"@intenda/opus-ui-map-location-iq",
				"@intenda/opus-ui-expo-interface",
			],
		},
	]);
};

const cloneOpusUiTemplate = (projectName) => {
	try {
		console.log(`Creating Opus UI project ${projectName}...`);

		execSync(`npx degit https://github.com/IntendaUK/opus-ui-example#main ${projectName}`, { stdio: 'inherit' });
	} catch (error) {
		console.error(`Failed to create Vite project: ${error.message}`);

		process.exit(1);
	}
};

const installLibraries = (libraries) => {
	if (!libraries.length) return;

	try {
		console.log(`Installing libraries: ${libraries.join(', ')}...`);

		execSync(`npm install ${libraries.join(' ')}`, { stdio: 'inherit' });
	} catch (error) {
		console.error(`Failed to install libraries: ${error.message}`);

		process.exit(1);
	}
};

const addDependenciesToMainFiles = async (libraries) => {
	if (!libraries.length) return;

	const importStatements = libraries.map(lib => `import '${lib}';`).join('\n');

	const addImportsToFile = async (filePath) => {
		try {
			const fileContent = await fs.readFile(filePath, 'utf8');
			const updatedContent = `//Opus Component Libraries\n${importStatements}\n\n${fileContent}`;

			await fs.writeFile(filePath, updatedContent, 'utf8');
		} catch (error) {
			console.error(`Failed to add libraries to ${filePath}: ${error.message}`);

			process.exit(1);
		}
	};

	await addImportsToFile(mainFileLocation);
	await addImportsToFile(mainHybridFileLocation);
};

const addEntriesToOpusUiConfigFile = async (opusUiLibraries, opusUiEnsembles) => {
	if (!opusUiLibraries?.length && !opusUiEnsembles?.length) return;

	try {
		const opusUiConfigContent = await fs.readFile(opusUiConfigFileLocation, 'utf8');
		const opusUiConfig = JSON.parse(opusUiConfigContent);

		if (opusUiLibraries?.length) opusUiConfig.opusUiComponentLibraries = opusUiLibraries;
		if (opusUiEnsembles?.length) opusUiConfig.opusUiEnsembles = opusUiEnsembles;

		const updatedOpusUiConfigContent = JSON.stringify(opusUiConfig, null, 4);
		await fs.writeFile(opusUiConfigFileLocation, updatedOpusUiConfigContent, 'utf8');
	} catch (error) {
		console.error(`Failed to add entries to ${opusUiConfigFileLocation}: ${error.message}`);

		process.exit(1);
	}
};

const setProjectInfoInPackage = async (projectName, projectDescription) => {
	try {
		const packageJsonContent = await fs.readFile(packageJsonFileLocation, 'utf8');
		const packageJson = JSON.parse(packageJsonContent);

		packageJson.name = projectName;
		packageJson.description = projectDescription;
		packageJson.version = "1.0.0";

		const updatedPackageJsonContent = JSON.stringify(packageJson, null, 4);
		await fs.writeFile(packageJsonFileLocation, updatedPackageJsonContent, 'utf8');
	} catch (error) {
		console.error(`Failed to add into to ${packageJsonFileLocation}: ${error.message}`);

		process.exit(1);
	}
};

const setProjectNameInIndexHtml = async (projectName) => {
	try {
		let indexHtmlContent = await fs.readFile(indexHtmlFileLocation, 'utf8');

		indexHtmlContent = indexHtmlContent.replace('Opus UI Example', projectName)

		await fs.writeFile(indexHtmlFileLocation, indexHtmlContent, 'utf8');
	} catch (error) {
		console.error(`Failed to name to ${indexHtmlFileLocation}: ${error.message}`);

		process.exit(1);
	}
};

const writeDataToFiles = async (projectName, projectDescription, libraries) => {
	console.log('Writing data to relevant files"...');

	await addDependenciesToMainFiles(libraries);

	await addEntriesToOpusUiConfigFile(libraries, []);

	await setProjectInfoInPackage(projectName, projectDescription);

	await setProjectNameInIndexHtml(projectName);
}

const main = async () => {
	const { projectName, projectDescription, libraries } = await promptUser();

	cloneOpusUiTemplate(projectName);

	process.chdir(projectName);

	installLibraries(libraries);

	await writeDataToFiles(projectName, projectDescription, libraries);

	console.log('Project setup is now complete. Run "npm start".');
};

program
	.name('create-opus-ui-app')
	.version('1.0.0')
	.description('CLI to create an Opus UI app with preinstalled libraries')
	.action(main);

program.parse(process.argv);
