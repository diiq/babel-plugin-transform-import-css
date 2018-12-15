// node >= 8
// babel == 6 plugin

const t = require('babel-types');
const path = require('path');
const PWD = process.cwd();

const CssImport = require('./css-import-visitor');
const {
  jsToAst, jsStringToAst, constAst, postcss,
} = require('./helpers');

module.exports = function(/*babel*/) {
  const pluginApi = {
    manipulateOptions (options) {
      return options;
    },

    visitor: {
      ImportDeclaration: {
        exit: CssImport(({ src, css, options, importNode, babelData }) => {
          const postcssOptions = { generateScopedName: options.generateScopedName };
          const { code, classesMap } = postcss.process(css, src, postcssOptions);
          babelData.replaceWithMultiple([
            classesMapConstAst({ classesMap, importNode }),
            putStyleIntoHeadAst({ code, id: cleanName(src) }),
          ]);
        }),
      },
    },
  };
  return pluginApi;
};

function classesMapConstAst({ importNode, classesMap }) {
  const classesMapAst = jsToAst(classesMap);
  const classesMapVarNameAst = t.identifier(importNode.local.name);

  return constAst(classesMapVarNameAst, classesMapAst);
}

function putStyleIntoHeadAst({ code, id }) {
  // What I want is to maybe-add a stylesheet with an id, then add these rules.
  return jsStringToAst(`require('style-from-string')(\`${ code }\`, "${id}")`);
}

function cleanName(str) {
  str = path.relative(PWD, str)
  return str.replace(/\//g, "_").replace(".css", "")
}