const fs = require('fs-extra')
const {fork} = require('child_process')
const Dat = require('dat-node')

const userBProcess = fork('./userB.js')
userBProcess.on('message', ({name, data}) => handlers[name](data))
userBProcess.on('message', ({name, data}) => console.log('parent process received', name))

// Create a dat with file '1.txt'
fs.ensureDirSync('./tmp/userA')
fs.writeFileSync('./tmp/userA/1.txt', 'hi 1')
var dat

Dat('./tmp/userA', (err, d) => {
  dat = d
  if (err) throw err
  dat.joinNetwork()
  dat.importFiles((err) => {
    if (err) throw err
    userBProcess.send({name: 'download1', data: dat.key.toString('hex')})
  })
})

const handlers = {
  // Add another file to the dat for userB to download
  addFile: () => {
    fs.writeFileSync('./tmp/userA/2.txt', 'hi 2')
    dat.importFiles((err) => {
      if (err) throw err
      userBProcess.send({name: 'download2', data: dat.key.toString('hex')})
    })
  },
  updateFile: () => {
    fs.writeFileSync('./tmp/userA/1.txt', 'bye 1')
    dat.importFiles((err) => {
      if (err) throw err
      userBProcess.send({name: 'checkUpdate', data: dat.key.toString('hex')})
    })
  },
  finish: () => {
    dat.close()
    console.log('done.')
  }
}
