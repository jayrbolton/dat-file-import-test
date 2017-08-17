const fs = require('fs-extra')
const Dat = require('dat-node')
const assert = require('assert')

process.on('message', ({name, data}) => handlers[name](data))
process.on('message', ({name, data}) => console.log('child process received', name))
fs.ensureDirSync('./tmp/userB')

function download (key, callback) {
  Dat('./tmp/userB', {key}, (err, dat) => {
    dat.joinNetwork()
    dat.archive.metadata.update(() => {
      dat.archive.on('sync', (err) => {
        console.log('userB download synced :]')
        dat.close()
        callback(err, dat)
      })
    })
  })
}

const handlers = {
  download1: (key) => {
    console.log('dat key', key)
    download(key, (err, dat) => {
      if (err) throw err
      const contents = fs.readFileSync('./tmp/userB/1.txt')
      assert.equal(contents, 'hi 1')
      process.send({name: 'addFile'})
    })
  },
  download2: (key) => {
    download(key, (err, dat) => {
      if (err) throw err
      const contents = fs.readFileSync('./tmp/userB/2.txt')
      assert.equal(contents, 'hi 2')
      process.send({name: 'updateFile'})
    })
  },
  checkUpdate: (key) => {
    download(key, (err, dat) => {
      if (err) throw err
      const contents = fs.readFileSync('./tmp/userB/1.txt')
      assert.equal(contents, 'bye 1')
      process.send({name: 'finish'})
      process.exit(1)
    })
  }
}
