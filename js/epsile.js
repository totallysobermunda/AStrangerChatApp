// epsile
// created by djazz

var Epsile = new function() {
    'use strict';

    var domID = function(id) { return document.getElementById(id); };
    var socket;
    var welcomeScreen = domID('welcomeScreen');
    var chatWindow = domID('chatWindow');
    var chatMain = domID('chatMain');
    var chatMainDiv = domID('chatMainDiv');
    var chatArea = domID('chatArea');
    var disconnectButton = domID('disconnectButton');
    var sendButton = domID('sendButton');
    var startButton = domID('startButton');
    var typingtimer = null;
    var isTyping = false;
    var isTypingDiv = domID('isTypingDiv');
    var strangerTyping = false;
    var disconnectType = false;
    var peopleOnline = 0;
    var peopleOnlineSpan = domID('peopleOnlineSpan');
    var alertSound = domID('alertSound');
    var isBlurred = false;
    var notify = 0;
    var firstNotify = true;
    var lastNotify = null;
    var notifyTimer = null;
    var url_pattern = /https?:\/\/([-\w\.]+)+(:\d+)?(\/([\w/_\.]*(\?\S+)?)?)?/;

    // mute the notification sound
    alertSound.volume = 0.0;

    function setTyping(state) {
        if (state) {
            isTypingDiv.style.bottom = 55 + "px";
        } else {
            isTypingDiv.style.bottom = (55 - isTypingDiv.offsetHeight) + "px";
        }
        strangerTyping = state;
    }

    function createConnection() {

        // connect to the socket.io server running on same host/port
        socket = io.connect(null, {
            reconnect: false,
            'force new connection': true
        });

        //chatMainDiv.innerHTML = "";
        //logChat(0, "Connecting to server...");

        socket.on('connect', function() {
            chatMainDiv.innerHTML = "";
            logChat(0, "Waiting for a stranger..", "center");
            setTyping(false);
        });

        socket.on('conn', function() { // Connected
            chatMainDiv.innerHTML = "";
            logChat(0, "You are now chatting with a random stranger. Say hi!");
            disconnectButton.disabled = false;
            disconnectButton.value = "Disconnect";
            sendButton.disabled = false;
            sendButton.value = "Send";
            document.getElementById("camera").style.pointerEvents = "auto";
            document.getElementById("chatArea").style.pointerEvents = "auto";
            chatArea.disabled = false;
            chatArea.value = "";
        });

        socket.on('disconn', function(data) {
            var who = data.who;
            var reason = data.reason;
            chatArea.disabled = true;
            document.getElementById("chatArea").style.pointerEvents = "none";
            document.getElementById("camera").style.pointerEvents = "none";



            switch (who) {
                case 1:
                    logChat(0, "You disconnected.");
                    break;
                case 2:
                    logChat(0, "Stranger disconnected.");
                    if (reason) {
                        logChat(0, "Reason: " + reason);
                    }
                    break;
            }
            clearTimeout(typingtimer);
            isTyping = false;
            setTyping(false);
            disconnectType = true;
            disconnectButton.disabled = false;
            sendButton.disabled = true;
            //logChat(-1, "<input type=button value='Start a new chat' onclick='Epsile.newStranger();'>");
            disconnectButton.value = "New";
            sendButton.value = "Send";
            chatArea.disabled = true;
            document.getElementById("chatArea").style.pointerEvents = "none";
            document.getElementById("camera").style.pointerEvents = "none";
        });

        socket.on('chat', function(message) {
            logChat(2, message);
            alertSound.currentTime = 0;
            if (isBlurred) {
                //alertSound.play();
            }
        });

        socket.on('typing', function(state) {
            setTyping(state);
        });

        socket.on('stats', function(stats) {
            if (stats.people !== undefined) {
                peopleOnlineSpan.innerHTML = stats.people;
            }

        });

        socket.on('disconnect', function() {
            logChat(0, "Connection imploded");
            logChat(-1, "<input type=button value='Reconnect' onclick='Epsile.startChat();'>");
            peopleOnlineSpan.innerHTML = "0";
            chatArea.disabled = true;
            document.getElementById("chatArea").style.pointerEvents = "none";
            document.getElementById("camera").style.pointerEvents = "none";
            disconnectButton.disabled = true;
            setTyping(false);
            disconnectType = false;
        });
        socket.on('error', function(e) {
            logChat(0, "Connection error");
            logChat(-1, "<input type=button value='Reconnect' onclick='Epsile.startChat();'>");
            peopleOnlineSpan.innerHTML = "0";
            chatArea.disabled = true;
            document.getElementById("chatArea").style.pointerEvents = "none";
            document.getElementById("camera").style.pointerEvents = "none";
            disconnectButton.disabled = true;
            sendButton.disabled = true;
            setTyping(false);
            disconnectType = false;
        });
    }

    function logChat(type, message, align) {
        var who = "";
        var who2 = "";
        var message2 = message;
        var node = document.createElement("div");
        node.style.display = "flex";
        if (type > 0) {
            if (type === 2) {
                who = "<div><span class='message-stranger'><span class='strangerChat'><\/span>";
                who2 = "Stranger: ";
            } else {
                node.style.justifyContent = "flex-end";
                who = "<div><span class='message-you'><span class='youChat'><\/span>";
            }
            // if (message.substr(0, 4) === '/me ') {
            //  message = message.substr(4);
            //  if (type === 2) {
            //      who = "<span class='strangerChat'>*** Stranger <\/span>";
            //     who2 = "*** Stranger ";
            // } else {
            //     who = "<span class='youChat'>*** You <\/span>";
            // }
            //     }
            message = message.replace(/\ < /g, "&lt;").replace(/\ > /g, "&gt;");
            var msg = message.split(" ");
            for (var i = 0; i < msg.length; i += 1) {
                if (url_pattern.test(msg[i]) && msg[i].indexOf("\"") === -1) {
                    msg[i] = "<a href=\"" + msg[i].replace(/\n/g, "") + "\" target=\"_blank\">" + msg[i].replace(/\n/g, "<br>") + "</a>";
                } else {
                    msg[i] = msg[i].replace(/\n/g, "<br>");
                }
            }
            message = msg.join(" ");
            node.innerHTML = who + message + "</span> </div>";
        } else {
            if (align == "center") {
                node.innerHTML = "<div class='wait-message'><span class='consoleChat'>" + message + "<\/span></div>";
            } else {
                node.innerHTML = "<span class='consoleChat'>" + message + "<\/span>";
            }
        }
        chatMainDiv.appendChild(node);
        chatMain.scrollTop = chatMain.scrollHeight;
        chatMain.scrollLeft = 0;
        if (isBlurred && (type === 0 || type === 2)) {
            alertSound.play();
            if (firstNotify && notify > 0 && window.webkitNotifications.checkPermission() === 0) {
                clearTimeout(notifyTimer);
                if (lastNotify) lastNotify.cancel();
                lastNotify = window.webkitNotifications.createNotification('img/epsile_logo32.png', 'Epsile' + (type === 0 ? ' Message' : ''), who2 + message2);
                lastNotify.show();
                firstNotify = false;
                notifyTimer = setTimeout(function() {
                    lastNotify.cancel();
                }, 7 * 1000);
            }
        }
    }

    this.startChat = function() {
        if (window.webkitNotifications && notify === 0) {
            if (window.webkitNotifications.checkPermission() === 0) {
                notify = 2;
            } else {
                window.webkitNotifications.requestPermission();
                notify = 1;
            }
        }
        welcomeScreen.style.display = 'none';
        chatWindow.style.display = 'block';
        createConnection();
    };

    this.newStranger = function() {
        if (socket) {
            chatArea.disabled = true;
            document.getElementById("chatArea").style.pointerEvents = "none";
            document.getElementById("camera").style.pointerEvents = "none";
            disconnectButton.disabled = true;
            sendButton.disabled = true;
            socket.emit("new");
            chatArea.innerText = "";
            chatMainDiv.innerHTML = "";
            logChat(0, "Waiting for a stranger..", "center");
            setTyping(false);
            disconnectType = false;
            disconnectButton.value = "Disconnect";
            sendButton.disabled = "Send";
        }
    };

    this.doDisconnect = function() {
        if (disconnectType === true) {
            disconnectType = false;
            disconnectButton.value = "Disconnect";
            Epsile.newStranger();
        } else if (socket) {
            var proceed = confirm("Are you sure you want to Disconnect?");
            if (proceed) {
                socket.emit("disconn");
                document.getElementById("chatArea").style.pointerEvents = "none";
                document.getElementById("camera").style.pointerEvents = "none";
                chatArea.disabled = true;
                disconnectType = true;
                disconnectButton.disabled = true;
                disconnectButton.value = "Disconnect";
            } else {
                //cancel
            }
        }
    };

    this.doSend = function() {
        var msg = chatArea.innerHTML;
        if (msg.length > 0) {
            if (typingtimer !== null) {
                clearTimeout(typingtimer);
            }
            if (isTyping) {
                socket.emit("typing", false); // Not typing
            }
            isTyping = false;
            socket.emit("chat", msg);
            logChat(1, msg);
            chatArea.innerText = "";
        }
    };

    /*function resizeWindow() {
    	//chatMain.style.height = (window.innerHeight-70-20)+"px";
    	chatArea.style.width = (window.innerWidth-94)+"px";
    }*/

    function onReady() {
        /*if (window.opera) {
        	var operacss = document.createElement("link");
        	operacss.setAttribute("rel", "stylesheet");
        	operacss.setAttribute("href", "opera.css");
        	document.getElementsByTagName("head")[0].appendChild(operacss);
        }*/
        //resizeWindow();

        startButton.disabled = false;
        startButton.focus();

    }
    setTimeout(onReady, 0);

    function blurred() {
        isBlurred = true;
        firstNotify = true;
    }

    function focused() {
        isBlurred = false;
        if (lastNotify) lastNotify.cancel();
        if (notifyTimer) clearTimeout(notifyTimer);
    }
    //window.addEventListener("resize", resizeWindow, false);
    //window.addEventListener("load", onReady, false);
    window.addEventListener("blur", blurred, false);
    window.addEventListener("focus", focused, false);
    disconnectButton.addEventListener('click', this.doDisconnect, false);
    sendButton.addEventListener('click', this.doSend, false);
    chatArea.addEventListener("keypress", function(e) {
        var kc = e.keyCode;
        if (kc === 13) {
            if (!e.shiftKey) {
                var msg = chatArea.innerHTML;
                if (msg.length > 0) {
                    if (typingtimer !== null) {
                        clearTimeout(typingtimer);
                    }
                    if (isTyping) {
                        socket.emit("typing", false); // Not typing
                    }
                    isTyping = false;
                    socket.emit("chat", msg);
                    logChat(1, msg);
                    chatArea.innerText = "";
                }
                e.preventDefault();
                e.returnValue = false;
                return false;
            }
        }
    }, false);
    chatArea.addEventListener("keyup", function(e) {
        if (socket) {
            if (typingtimer !== null) {
                clearTimeout(typingtimer);
            }

            if (chatArea.innerText === "" && isTyping) {
                socket.emit("typing", false); // Not typing
                isTyping = false;
            } else {
                if (!isTyping && chatArea.innerText.length > 0) {
                    socket.emit("typing", true);
                    isTyping = true;
                }

                typingtimer = setTimeout(function() {
                    if (socket && isTyping) {
                        socket.emit("typing", false); // Not typing
                    }
                    isTyping = false;
                }, 10 * 1000);
            }
        }
    }, false);
};

function readURL(input) {

    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function(e) {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.style.height = "300px";
            img.style.width = "280px";
            chatArea.appendChild(img);
        }

        reader.readAsDataURL(input.files[0]);
    }
}


document.getElementById('file').onchange = function() {
    readURL(this);
};

function redirect() {
    if (confirm('Are you sure you want to go back to home page?')) {
        document.location = 'https://akadbkad.com'
    }
}