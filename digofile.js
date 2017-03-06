var digo = require("digo");
digo.config({
	ignore: ["./digofile.js", "_*", ".*"],
	ignoreFile: ".gitignore",
	// sourceMap: true
});

exports.build = function() {
	digo.src("*").pipe("digo-web-pack", (list, packer) => {
		list.src("*.less").pipe("digo-less", {
			paths: ["components"]
		});
		list.src("*.css").pipe("digo-autoprefixer", {
			browsers: [">1%"]
		});
		list.src("*.ts", "*.tsx").pipe("digo-typescript", "tsconfig.json");
		list.src("*.md").pipe("digo-marked").pipe(file => {
			file.content = file.content.replace(/<script type="text\/html">([\s\S]*?)<\/script>/g, "$1");
		});
		list.src("*.htm", "*.html").pipe(packer.html, {
			langs: {
				"text/javascript": ".tsx"
			}
		});
		list.src("*.js").pipe(packer.js, {
			resolve: {
				root: "components",
				packageMains: ["main", "typings"],
				extensions: ["", ".tsx", ".ts", ".js"],
				alias: {
					"assert": "assets/_tpl/test/assert.js"
				}
			},
			require: {
				root: "src"
			}
		});
	}).dest("./_build");

	digo.src("./src/**/test*").pipe(function(file) {
		file.ext = ".html";
		file.content = digo.readFile("src/@tpl/test/test.html").toString()
			.replace(/__root/g, "../".repeat(file.name.split("/").length))
			.replace(/__fileNameNoExt/g, digo.getFileName(file.name, false));
	}).dest("./_build/src");
};

exports.default = exports.watch = function() {
	digo.watch(exports.build);
};

exports.new = function() {
	const options = digo.parseArgs();
	if (!options[1]) {
		digo.info("用法：digo new <组件名> [组件中文描述]\n  如：digo new button 按钮");
		return;
	}
	if (!options.js && !options.css) {
		options.js = options.css = true;
	}
	options.path = options[1];
	options.description = options[2] || options.path;
	options.author = options.author || digo.exec("git config user.name", { slient: true }).output.join("").trim();
	options.email = options.email || digo.exec("git config user.email", { slient: true }).output.join("").trim();
	options.fileName = options.fileName || digo.getFileName(options.path);
	options.filename = options.filename || options.fileName.toLowerCase();
	options.FileName = options.fileName.charAt(0).toUpperCase() + options.fileName.slice(1);
	options.ext = options.css ? ".tsx" : ".ts";
	options.root = "../".repeat(options.path.split("/").length + 1);

	if (options.js && options.css) {
		digo.writeFileIf(`src/${options.path}/${options.fileName}.less`, getTpl(`src/@tpl/js-css/@tpl.less`));
		digo.writeFileIf(`src/${options.path}/${options.fileName}.tsx`, getTpl(`src/@tpl/js-css/@tpl.tsx`));
		digo.writeFileIf(`src/${options.path}/package.json`, getTpl(`src/@tpl/js-css/package.json`));
		digo.writeFileIf(`src/${options.path}/index.md`, getTpl(`src/@tpl/js-css/index.md`));
		digo.writeFileIf(`src/${options.path}/test.tsx`, getTpl(`src/@tpl/js-css/test.tsx`));
	} else if (options.js) {
		digo.writeFileIf(`src/${options.path}/${options.fileName}.ts`, getTpl(`src/@tpl/js/@tpl.ts`));
		digo.writeFileIf(`src/${options.path}/package.json`, getTpl(`src/@tpl/js/package.json`));
		digo.writeFileIf(`src/${options.path}/index.md`, getTpl(`src/@tpl/js/index.md`));
		digo.writeFileIf(`src/${options.path}/test.ts`, getTpl(`src/@tpl/js/test.ts`));
	} else if (options.css) {
		digo.writeFileIf(`src/${options.path}/${options.fileName}.less`, getTpl(`src/@tpl/css/@tpl.less`));
		digo.writeFileIf(`src/${options.path}/package.json`, getTpl(`src/@tpl/css/package.json`));
		digo.writeFileIf(`src/${options.path}/index.md`, getTpl(`src/@tpl/css/index.md`));
	}

	function getTpl(tpl) {
		return digo.readFile(tpl).toString().replace(/__([a-z]+)/ig, function(all, name) {
			return options[name] || name
		});
	}
};

exports.test = function() {
	const options = digo.parseArgs();
	let path = digo.relativePath(options[1] || "");
	if (/^src\//.test(path)) {
		path = "_build/" + path;
		if (/\.md$/.test(path)) {
			path = path.replace(/\.md$/, ".html");
		} else if (digo.existsFile(path.replace(/\/[^\/]*$/, "/test.html"))) {
			path = path.replace(/\/[^\/]*$/, "/test.html");
		}
	}
	digo.exec((process.platform === "win32" ? "start" : "open") + " file:///" + digo.resolvePath(path), function() {});
};
