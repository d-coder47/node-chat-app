const socket = io()

//Elements
const $messageForm = document.querySelector('#messageForm')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocation = document.querySelector('#sendLocation')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationUrl = document.querySelector('#locationUrl-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})


const autoScroll = () =>{
	// new message element
	const $newMessage = $messages.lastElementChild

	// get the height of new message
	const newMessageStyles = getComputedStyle($newMessage)
	const newMessageMargin = parseInt(newMessageStyles.marginBottom)
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

	// visible height
	const visibleHeight = $messages.offsetHeight

	// height of messages container
	const containerHeight = $messages.scrollHeight

	// how far have I scrolled
	const scrollOffset = $messages.scrollTop + visibleHeight

	if(containerHeight - newMessageHeight <= scrollOffset){
		$messages.scrollTop = $messages.scrollHeight
	}
	// scroll offset + visible height = container height 
	// console.log(`VH: ${visibleHeight}; CH: ${containerHeight}; SO: ${scrollOffset}; NMH: ${newMessageHeight}`)
}


socket.on('locationMessage', (msg, url) =>{
	console.log(msg, url)
	const html = Mustache.render(locationUrl,{
		username: msg.username,
		url: url.url,
		createdAt: moment(url.createdAt).format('h:mm a')
	})
	$messages.insertAdjacentHTML('beforeend', html)
	autoScroll()
})

socket.on('roomData', ({room, users}) =>{
	const html = Mustache.render(sidebarTemplate, {
		room,
		users
	})
	document.querySelector('#sidebar').innerHTML = html
})


socket.on('message', (msg) =>{
	console.log(username)
	const html = Mustache.render(messageTemplate, {
		username: msg.username,
		createdAt: moment(msg.createdAt).format('h:mm a'),
		msg: msg.text,
	})
	$messages.insertAdjacentHTML('beforeend', html)
	autoScroll()
})

$messageForm.addEventListener('submit', (e) =>{
	e.preventDefault()
	$messageFormButton.setAttribute('disabled', 'disabled')
	// disable
	const message = e.target.elements.message.value
	socket.emit('sendMessage', message, (error) =>{
		//enable
		$messageFormButton.removeAttribute('disabled')
		$messageFormInput.value = ''
		$messageFormInput.focus()
		if(error){
			console.log(error)
		}

		console.log('Message delivered!')
	})
})



$sendLocation.addEventListener('click', () =>{
	if(!navigator.geolocation){
		return alert('Geolocation is not supported by your browser.')
	}
	$sendLocation.setAttribute('disabled', 'disabled')

	navigator.geolocation.getCurrentPosition((position) =>{
		const location = {
			longitude: position.coords.longitude,
			latitude: position.coords.latitude
		}
		socket.emit('sendLocation', location, () =>{
			$sendLocation.removeAttribute('disabled')
			console.log('Location shared!')
		})
	})
	
})

socket.emit('join', {username, room}, (error) =>{
	if(error){
		alert(error)
		location.href='/'
	}
})