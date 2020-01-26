const fs = require('fs')
const path = require('path')

const copydir = require('copy-dir')
const zip = require('cross-zip')
const rimraf = require('rimraf')
const {version} = require('../package.json')

async function createArtifact() {
  let artifactFolder = path.resolve(__dirname, './tikzcd-editor')

  if (fs.existsSync(artifactFolder)) {
    await new Promise(resolve => {
      rimraf(artifactFolder, resolve)
    })
  }

  fs.mkdirSync(artifactFolder)

  copydir.sync(path.resolve(__dirname, '..'), artifactFolder, {
    filter: (_, filepath, __) => {
      return (
        [
          path.resolve(__dirname, '../css'),
          path.resolve(__dirname, '../img')
        ].some(x => filepath.startsWith(x)) ||
        [
          path.resolve(__dirname, '..'),
          path.resolve(__dirname, '../bundle.js'),
          path.resolve(__dirname, '../favicon.ico'),
          path.resolve(__dirname, '../index.html'),
          path.resolve(__dirname, '../LICENSE')
        ].includes(filepath)
      )
    }
  })

  zip.zipSync(
    artifactFolder,
    path.resolve(__dirname, `tikzcd-editor-v${version}.zip`)
  )
}

createArtifact().catch(console.error)
