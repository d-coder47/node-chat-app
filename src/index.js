const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessages}= require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
// express would do this behind the scenes
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirPath = path.join(__dirname, '../public')


app.use(express.static(publicDirPath))



io.on('connection', (socket) =>{
	console.log('New WebSocket connection')


	socket.on('join', (options, callback) =>{
		// username, room -> ...options
		const { error, user } = addUser({id: socket.id, ...options})
		
		if(error){
			return callback(error)
		}

		socket.join(user.room)

		//io.to().emit()
		//socket.broadcast.to().emit()

		socket.emit('message', generateMessage('Admin', 'Welcome to Chat App!'))
		socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined!`))	

		io.to(user.room).emit('roomData', {
			room: user.room,
			users: getUsersInRoom(user.room)
		})
		callback()	
	})

	socket.on('sendMessage', (msg, callback) =>{
		const filter = new Filter()
		const user = getUser(socket.id)

		if(filter.isProfane(msg)){
			return callback('Profanity is not allowed')
		}

		io.to(user.room).emit('message', generateMessage(user.username, msg))
		callback('Delivered!')
	})

	socket.on('disconnect', () =>{
		const user = removeUser(socket.id)

		if(user){
			io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
			io.to(user.room).emit('roomData', {
				room: user.room,
				users: getUsersInRoom(user.room)
			})
		}
	})

	socket.on('sendLocation', (location, callback) =>{
		const user = getUser(socket.id)
		const long = location.longitude
		const lat = location.latitude
		//io.emit('message', `https://www.google.com/maps?q=${long},${lat}`) 
		io.to(user.room).emit('locationMessage', generateLocationMessages(user.username, `https://www.google.com/maps?q=${long},${lat}`))
		// https://www.google.com/maps?q=lat,long
		callback()
	})

})

server.listen(port, () =>{
	console.log(`Server is listening on port: ${port}`)
})









