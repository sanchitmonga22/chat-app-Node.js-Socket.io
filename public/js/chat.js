const socket = io();

//Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $locationForm = document.querySelector("#sendLocation");
const $messages = document.querySelector("#messages");

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const {
    username,
    room
} = Qs.parse(location.search, { // contains the query options in the url provided by the user
    ignoreQueryPrefix: true // this just ignores the first character of the query string
})

const autoscroll = () => {
    // New Message Element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible Height
    const visibleHeight = $messages.offsetHeight

    // Height of the necessary container
    const containerHeight = $messages.scrollHeight

    // How far have the user scrolled
    const scrolloffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrolloffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

}

// listening for the messages in the server
socket.on("message", (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:m a"),
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll()
});

socket.on("locationMessage", (message) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:m a"),
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll()
});

socket.on('roomData', ({
    room,
    users
}) => {
    const html = Mustache.render(sideBarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    $messageForm.setAttribute("disabled", "disabled");
    // disable
    const message = e.target.elements.message.value;

    socket.emit("sendMessage", message, (error) => {
        $messageForm.removeAttribute("disabled");
        $messageFormInput.value = "";
        $messageFormInput.focus();
        //enable
        if (error) {
            console.log(error);
        } else {
            console.log("The message was " + message);
        }
    });
});

$locationForm.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser");
    }
    $locationForm.setAttribute("disabled", "disabled");
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit(
            "sendLocation", {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            },
            () => {
                $locationForm.removeAttribute("disabled");
                console.log("Location shared");
            }
        );
    });
});

socket.emit('join', {
    username,
    room
}, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})