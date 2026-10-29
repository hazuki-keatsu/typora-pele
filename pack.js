import * as fs from 'node:fs'
import archiver from 'archiver'


const output = fs.createWriteStream('plugin.zip')

const archive = archiver('zip', { zlib: { level: 9 } })
  .on('error', (err) => { throw err })

archive.pipe(output)

archive
  .directory('dist', false)
  .file('src/manifest.json', { name: 'manifest.json' })
  .file('LICENSE.md', { name: 'LICENSE.md' })
  .file('node_modules/pele/LICENSE', { name: 'licenses/pele.txt' })

archive.finalize()
