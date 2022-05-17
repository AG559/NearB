const socket = io();
const chatForm = document.getElementById('chat-form');
const chatMessage = document.querySelector('.chat-messages');

// Get username and Room
const {username,room}= Qs.parse(location.search,{ignoreQueryPrefix:true})

// Set Ui to Room
const roomName = document.getElementById('room-name')
const userList = document.getElementById('users')
roomName.innerText = room;

// Join Chat Room
socket.emit('joinRoom',username,room)

// Ui Emit
socket.on('roomUsers',(users)=>{
    userList.innerHTML =users.map(user => `<li>${user.username}</li>`).join('')
})

// Message Emit
socket.on('message', (message) => {
    outputMessage(message);
    
    // scroll Down
    chatMessage.scrollTop = chatMessage.scrollHeight;
})

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    socket.emit('chatMessage', e.target.elements.msg.value);
    
    //Clear message and Focus
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
})

function outputMessage(message) {
    const div = document.createElement('div')
    div.classList.add('message')
    div.innerHTML = ` <p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">${message.text}</p>`
    document.querySelector('.chat-messages').appendChild(div)

}
