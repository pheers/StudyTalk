var selected_chat = null;
var form = null;
let selected_chat_id = null;

function windowIsActive() {
    var isActive = true;
    if (/*@cc_on!@*/false) { // для Internet Explorer
        document.onfocusin = function () {
            isActive = true;
        };
        document.onfocusout = function () {
            isActive = false;
        };
    } else {
        window.onfocus = function () {
            isActive = true;
        };
        window.onblur = function () {
            isActive = false;
        };
        ;

    }
    return isActive;
}

const socket = new WebSocket(`ws://${window.location.host}/ws/users`);
socket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    if (data.type == 'message') {
        if (data.message.time) {
            time = new Date(data.message.time)
        } else {
            time = new Date('August 19, 1975 00:00:00');
        }


        console.log(data);
        if (document.getElementsByClassName('current-chat-block__input-block__items')[0]) {
            if (data.chat_id == document.getElementsByClassName('current-chat-block__input-block__items')[0].id) {
                let content = document.getElementsByClassName('current-chat-block__content')[0];
                let prev_mes = content.firstElementChild;
                let mes = document.createElement("div");
                let mes_content = document.createElement("div");
                selectClickEvent(mes_content, content)

                mes.className = 'message-block';
                if (prev_mes) {
                    if ([new Date(prev_mes.dataset.date).getDate(), new Date(prev_mes.dataset.date).getMonth() + 1, new Date(prev_mes.dataset.date).getFullYear()].join('.') != [time.getDate(), time.getMonth() + 1, time.getFullYear()].join('.')) {
                        let date = document.createElement('div');
                        date.style.textAlign = "center";
                        date.innerHTML = `<p class = "gray-text">${[time.getDate(), time.getMonth() + 1, time.getFullYear()].map(function (x) {
                            return x < 10 ? "0" + x : x
                        }).join('.')}</p>`;
                        content.prepend(date);
                    }
                    if (!(prev_mes.dataset.authorId == data.author.id)) {
                        mes.classList.add('start-row');
                        if (data.author.id != 'me') {
                            if (data.author.name) {
                                sender_name = document.createElement('h5');
                                sender_name.append(`${data.author.name} ${data.author.last_name}`);
                                mes_content.appendChild(sender_name);
                            }

                        }

                        let avatar = document.createElement("img", []);
                        avatar.className = "account-avatar";
                        avatar.src = data.author.ava_url;
                        avatar.alt = 'user avatar';
                        mes.appendChild(avatar);
                    } else {
                        mes.classList.add('in-row');
                    }
                } else {
                    if (data.author.id != 'me') {
                        sender_name = document.createElement('h5');
                        sender_name.append(`${data.author.name} ${data.author.last_name}`);
                        mes_content.appendChild(sender_name);
                    }
                    let avatar = document.createElement("img", []);
                    avatar.className = "account-avatar";
                    avatar.src = data.author.ava_url;
                    avatar.alt = 'user avatar';
                    mes.appendChild(avatar);
                    let date = document.createElement('div');
                    date.style.textAlign = "center";
                    date.innerHTML = `<p class = "gray-text">${[time.getDate(), time.getMonth() + 1, time.getFullYear()].map(function (x) {
                        return x < 10 ? "0" + x : x
                    }).join('.')}</p>`;
                    content.prepend(date);
                }


                mes_content.className = 'message-block__content';
                mes.setAttribute('data-author-id', data.author.id);
                mes.setAttribute('data-date', time);
                mes.setAttribute('data-message-id', data.message.id);

                if (data.author.id == 'me') {
                    mes.classList.add('me');
                    mes_content.classList.add('me');
                    content.scrollTop = 0;
                } else {
                    if (content.scrollTop >= -20) {
                        ReadMess(data.chat_id, 1)
                    } else {
                        mark = chat.querySelector('.unread-mess-count');
                        if (mark) {
                            text = mark.getElementsByTagName('h5')[0];
                            text.innerHTML = String(Number(text.innerHTML) + 1)
                        } else {
                            mark = document.createElement("div");
                            mark.className = 'unread-mess-count';
                            mark.innerHTML = "<h5>1</h5>";
                            chat.append(mark);
                        }
                    }

                }

                mes_text = document.createElement('p');
                mes_text.append(data.message.text);
                time_mes = document.createElement('p');
                time_mes.className = 'time-send-mess';
                time_mes.append(`${[time.getHours(), time.getMinutes()].map(function (x) {
                    return x < 10 ? "0" + x : x
                }).join(":")}`);
                mes_content.appendChild(mes_text);
                mes_content.appendChild(time_mes);
                mes.appendChild(mes_content);
                content.prepend(mes);

            } else {
                if (data.author.id != 'me') {
                    chat = document.getElementById(data.chat_id);
                    mark = chat.querySelector('.unread-mess-count');
                    if (mark) {
                        text = mark.getElementsByTagName('h5')[0];
                        text.innerHTML = String(Number(text.innerHTML) + 1)
                    } else {
                        mark = document.createElement("div");
                        mark.className = 'unread-mess-count';
                        mark.innerHTML = "<h5>1</h5>";
                        chat.append(mark);
                    }
                }
            }
        } else {
            if (data.author.id != 'me') {
                chat = document.getElementById(data.chat_id);
                mark = chat.getElementsByClassName('unread-mess-count')[0];
                if (mark) {
                    text = mark.getElementsByTagName('h5')[0];
                    text.innerHTML = String(Number(text.innerHTML) + 1)
                } else {
                    mark = document.createElement("div");
                    mark.className = 'unread-mess-count';
                    mark.innerHTML = "<h5>1</h5>";
                    chat.append(mark);
                }
            }
        }
        chats_wrapper = document.getElementsByClassName('chats-wrapper__inner')[0];
        chat = document.getElementById(data.chat_id);
        last_message = chat.getElementsByClassName('gray-text')[0];
        if (last_message) {
            last_message.innerHTML = data.author.name ? `${data.author.name}: ${data.message.text}` : `${data.message.text}`;
        } else {
            last_message = document.createElement('p');
            last_message.className = 'gray-text';
            last_message.append(data.author.name ? `${data.author.name}: ${data.message.text}` : `${data.message.text}`);
            chat.firstElementChild.lastElementChild.appendChild(last_message);
        }
        chats_wrapper.removeChild(chat);
        chats_wrapper.prepend(chat);
        if (!windowIsActive()) {
            var audio = new Audio(); // Создаём новый элемент Audio
            audio.src = '/static/audio/message.mp3'; // Указываем путь к звуку "клика"
            audio.autoplay = true;
        }
    }
    else if (data.type == 'add_chat') {
        chats_wrapper = document.getElementsByClassName('chats-wrapper__inner')[0];

        let chat = document.createElement("div");
        chat.className = 'chat-wrapper__inner__stroke';
        chat.setAttribute('id', data.chat.id)
        chat.addEventListener("click", function (e) {
            getMessages(chat)

        });
        let chat_inner = document.createElement("div");
        chat_inner.className = 'chats-wrapper__inner__stroke__user';
        let avatar = document.createElement("img", []);
        avatar.className = "account-avatar";
        avatar.src = data.chat.ava_url;
        avatar.alt = 'user avatar';
        chat_inner.appendChild(avatar);
        let chat_info = document.createElement('div');
        chat_info.className = 'user-info-wrapper';
        chat_info.innerHTML = `<h4 class=\"\">${data.chat.name}</h4> <p class="gray-text">Чат создан</p>`;
        chat_inner.appendChild(chat_info);
        chat.appendChild(chat_inner);
        chats_wrapper.prepend(chat);
    }

};

chats = document.querySelectorAll('.chat-wrapper__inner__stroke')
chats.forEach(function (chat) {
    chat.addEventListener("click", function (e) {
        getMessages(chat)
        activateDropDowns()
    });
})


function CreateRequest() {
    let Request = false;

    if (window.XMLHttpRequest) {
        //Gecko-совместимые браузеры, Safari, Konqueror
        Request = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
        //Internet explorer
        try {
            Request = new ActiveXObject("Microsoft.XMLHTTP");
        } catch (CatchException) {
            Request = new ActiveXObject("Msxml2.XMLHTTP");
        }
    }

    if (!Request) {
        alert("Невозможно создать XMLHttpRequest");
    }

    return Request;
}

function SendRequest(r_method, r_path, r_args, r_handler) {

    //Создаём запрос
    var Request = CreateRequest();

    //Проверяем существование запроса еще раз
    if (!Request) {
        return;
    }

    //Назначаем пользовательский обработчик
    Request.onreadystatechange = function () {
        //Если обмен данными завершен
        if (Request.readyState == 4) {
            //Передаем управление обработчику пользователя
            r_handler(Request);
        }
    }

    //Проверяем, если требуется сделать GET-запрос
    if (r_method.toLowerCase() == "get" && r_args.length > 0)
        r_path += "?" + r_args;

    //Инициализируем соединение
    Request.open(r_method, r_path, true);

    if (r_method.toLowerCase() == "post") {
        //Если это POST-запрос

        //Устанавливаем заголовок
        Request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
        //Посылаем запрос
        Request.send(r_args);
    } else {
        //Если это GET-запрос

        //Посылаем нуль-запрос
        Request.send(null);
    }

    Request.onreadystatechange = function () {
        //Если обмен данными завершен
        if (Request.readyState == 4) {
            if (Request.status == 200) {
                //Передаем управление обработчику пользователя
                r_handler(Request);
            } else {
                //Оповещаем пользователя о произошедшей ошибке
            }
        } else {
            //Оповещаем пользователя о загрузке
        }

    }
}

function sendMessage(e) {
    let input = e.target.getElementsByClassName('message-input')[0]
    if (input.value) {
        socket.send(JSON.stringify({
            'type': 'send_message',
            'message': input.value,
            'chat': e.target.id,
        }));
        input.value = '';
    }
}


function getMessages(chat) {
    const Handler = function (Request) {

        jsn = JSON.parse(Request.response);

        if (!jsn.error) {
            selected_chat_id = chat.id
            console.log(jsn);

            //Header
            let header = document.createElement('div');
            header.className = 'current-chat-block__header';
            let header_user = document.createElement('a');
            header_user.className = 'current-chat-block__header__user';
            header_user.href = '#chat-info-popup';
            if (jsn.chat.members) {
                header_user.addEventListener('click', function (event) {
                    const popupName = this.getAttribute('href').replace('#', '')
                    const currentPopup = document.getElementById(popupName)
                    popupOpen(currentPopup)
                    event.preventDefault();
                })
            }
            let header_interface = document.createElement('div');
            header_interface.className = 'current-chat-block__header__interface'
            header_interface.innerHTML = '<button class="interface-btn" id="delete-messages">Удалить</button>\n' +
                '                    <button class="interface-btn" id="cancel-selection">Отмена</button>'
            let avatar = document.createElement('img');
            avatar.className = "account-avatar";
            avatar.src = jsn.chat.ava_url;
            avatar.alt = 'user avatar';
            let user_info = document.createElement('div');
            user_info.className = 'user-info-wrapper';
            user_info.innerHTML = `<h4 class=\"\">${jsn.chat.name}</h4>\n` +
                `<p class=\"gray-text\">${jsn.chat.info}</p>\n`;
            header_user.appendChild(avatar);
            header_user.appendChild(user_info);
            header.appendChild(header_user);
            header.appendChild(header_interface);

            //Current Chat
            let content = document.createElement('div');
            content.className = 'current-chat-block__content';
            for (const key in jsn.messages) {
                if (jsn.messages[key].time) {
                    time = new Date(jsn.messages[key].time)
                } else {
                    time = new Date('August 19, 1975 00:00:00');
                }
                prev_time = null;
                if (jsn.messages[Number(key) + 1]) {
                    console.log(jsn.messages);
                    prev_time = new Date(jsn.messages[Number(key) + 1].time ? jsn.messages[Number(key) + 1].time : 'August 19, 1975 00:00:00');
                    console.log(time);
                }
                let date = document.createElement('div');
                date.style.textAlign = "center";

                let mes = document.createElement("div");
                let mes_content = document.createElement("div");
                mes.className = 'message-block';
                mes_content.className = 'message-block__content';
                selectClickEvent(mes_content, content)

                mes.setAttribute('data-author-id', jsn.messages[key].author.id);
                mes.setAttribute('data-date', time);
                mes.setAttribute('data-message-id', jsn.messages[key].id);
                if (jsn.messages[Number(key) + 1]) {

                    if (!(jsn.messages[Number(key) + 1].author.id == jsn.messages[key].author.id)) {
                        mes.classList.add('start-row');
                        if (jsn.messages[key].author.id != 'me') {

                            if (jsn.messages[key].author.name) {
                                sender_name = document.createElement('h5');
                                sender_name.append(`${jsn.messages[key].author.name}`);
                                mes_content.appendChild(sender_name);
                            }
                        }
                        let avatar = document.createElement("img");
                        avatar.className = "account-avatar";
                        avatar.src = jsn.messages[key].author.ava_url;
                        avatar.alt = 'user avatar';
                        mes.appendChild(avatar);
                    } else {
                        mes.classList.add('in-row');
                    }
                } else {
                    mes.classList.add('start-row');

                    if (jsn.messages[key].author.id != 'me') {

                        if (jsn.messages[key].author.name) {
                            sender_name = document.createElement('h5');
                            sender_name.append(`${jsn.messages[key].author.name}`);
                            mes_content.appendChild(sender_name);
                        }
                    }
                    let avatar = document.createElement("img");
                    avatar.className = "account-avatar";
                    avatar.src = jsn.messages[key].author.ava_url;
                    avatar.alt = 'user avatar';
                    mes.appendChild(avatar);
                }

                if (jsn.messages[key].author.id == 'me') {
                    mes.classList.add('me');
                    mes_content.classList.add('me');
                }
                mes_text = document.createElement('p');
                mes_text.append(jsn.messages[key].text);
                time_mes = document.createElement('p');
                time_mes.className = 'time-send-mess';
                time_mes.append(`${[time.getHours(), time.getMinutes()].map(function (x) {
                    return x < 10 ? "0" + x : x
                }).join(":")}`);
                mes_content.appendChild(mes_text);
                mes_content.appendChild(time_mes);
                mes.appendChild(mes_content);
                content.append(mes);
                if (prev_time) {
                    if ([prev_time.getDate(), prev_time.getMonth() + 1, prev_time.getFullYear()].join('.') != [time.getDate(), time.getMonth() + 1, time.getFullYear()].join('.')) {
                        date.innerHTML = `<p class = "gray-text">${[time.getDate(), time.getMonth() + 1, time.getFullYear()].map(function (x) {
                            return x < 10 ? "0" + x : x
                        }).join('.')}</p>`;
                        content.append(date);
                    }
                } else {
                    date.innerHTML = `<p class = "gray-text">${[time.getDate(), time.getMonth() + 1, time.getFullYear()].map(function (x) {
                        return x < 10 ? "0" + x : x
                    }).join('.')}</p>`;
                    content.append(date);
                }

            }

            //Input
            let input = document.createElement('div');
            input.className = 'current-chat-block__input-block';
            input.innerHTML = `<form id='${jsn.chat.id}' onsubmit='return false;' class=\"current-chat-block__input-block__items\">\n` +
                `                 <input name='sendMessage' type=\"text\" class=\"message-input\" autocomplete=\"off\" placeholder=\"Напишите сообщение...\">\n` +
                "                 <button type='submit' style='background: none'><img class=\"message-icon\" src=\"/static/images/airplane.svg\" alt=\"Отправить\"></button>\n" +
                "              </form>\n";

            //MediaFilesDropDown
            let mediaDropDown = document.createElement('div')
            mediaDropDown.className = "mess-media-dropdown js-dropdown"
            mediaDropDown.innerHTML =
                "                    <div class=\"media-dropdown-content js-dropdown-content\">\n" +
                "                        <div class=\"media-opt\">\n" +
                "                            <span class=\"iconify opt-icon\" data-icon=\"foundation:photo\"></span>\n" +
                "                            <p>Фотография</p>\n" +
                "                        </div>\n" +
                "                        <div class=\"media-opt\">\n" +
                "                            <span class=\"iconify opt-icon\" data-icon=\"akar-icons:file\"></span>\n" +
                "                            <p>Файл</p>\n" +
                "                        </div>\n" +
                "                    </div>\n" +
                "                    <div class=\"options-item\">\n" +
                "                        <img class=\"message-icon\" src=\"/static/images/paperclip.svg\" alt=\"Вложение\">\n" +
                "                    </div>\n"

            let timerId
            mediaDropDown.addEventListener('mouseleave', function () {
                timerId = setTimeout(() => {
                    this.querySelector('.media-dropdown-content').classList.remove('is-show')
                }, 300);

            })
            mediaDropDown.addEventListener('mouseenter', function () {
                clearTimeout(timerId)
                setTimeout(() => {
                    this.querySelector('.media-dropdown-content').classList.add('is-show')
                }, 300);
            })
            input.style.paddingLeft = "15px"
            //input.insertBefore(mediaDropDown, input.firstChild)

            //ScrollDown Button
            let scrollDown = document.createElement('div');
            scrollDown.className = 'scroll-circle';
            scrollDown.innerHTML = "<span id=\"scroll-down\" class=\"iconify scroll-icon\" data-icon=\"akar-icons:arrow-down\"></span>\n"
            scrollDown.addEventListener('click', function (e) {
                if (this) {
                    content.scrollTop = 0
                }
            })
            content.addEventListener('scroll', function () {
                const scrollTriggerMessCount = 3
                let firstMessages = Array.from(content.querySelectorAll('.message-block__content'))
                let firstMessArray = firstMessages.slice(0, scrollTriggerMessCount) // первые 3 сообщения
                if (firstMessArray) {
                    if (Visible(firstMessArray)) {
                        // console.log('vidno')
                        scrollDown.classList.remove('is-show')
                    } else {
                        // console.log('ne vidno');
                        scrollDown.classList.add('is-show')
                    }
                }

                mark = chat.querySelector('.unread-mess-count');
                if (mark) {
                    if (content.scrollTop >= 0) {
                        ReadMess(chat.id, "all")
                        chat.removeChild(mark)
                    } else {
                        let unreadCount = Number(mark.getElementsByTagName('h5')[0].innerHTML)
                        let unreadedMessages = Array.from(content.querySelectorAll('.message-block__content')).slice(0, unreadCount)
                        Visible(unreadedMessages)
                        if (unreadCount != String(unreadedMessages.length)) {
                            ReadMess(chat.id, Number(unreadCount) - unreadedMessages.length)
                            unreadCount = String(unreadedMessages.length)
                            if (unreadCount == 0) {
                                chat.removeChild(mark)
                            } else {
                                mark.firstElementChild.innerHTML = unreadCount
                            }
                        }
                    }


                    console.log('count updated SCROLLEVENT')
                }
            });

            //Appending
            let chat_block = document.getElementsByClassName('current-chat-block')[0];
            chat_block.innerHTML = '';
            chat_block.appendChild(header);
            chat_block.appendChild(content);
            chat_block.appendChild(input);
            chat_block.appendChild(scrollDown);
            mark = chat.querySelector('.unread-mess-count');
            if (mark) {
                let unreadCount = Number(mark.getElementsByTagName('h5')[0].innerHTML)
                console.log(unreadCount)
                first_uread_mes = Array.from(content.querySelectorAll('.message-block__content'))[unreadCount - 1]
                if (first_uread_mes) {

                    scroll_height = window.screen.availHeight - first_uread_mes.offsetTop - 190 - $(first_uread_mes).height()
                    content.scrollTop = -scroll_height;
                }
                if (content.scrollTop >= 0) {
                    ReadMess(chat.id, 'all')
                    chat.removeChild(mark)
                }
            }


            if (selected_chat) {
                document.getElementById(selected_chat).classList.remove('active');
            }
            chat.classList.add('active');
            selected_chat = chat.id;
            form = document.getElementsByClassName('current-chat-block__input-block__items').item(0)
            form.addEventListener("submit", sendMessage)
            let info_form = document.querySelector("#chat-info-popup");
            let picture = info_form.querySelector('.image-input')
            picture.nextElementSibling.querySelector(".display-image").style.backgroundImage = `url(${jsn.chat.ava_url})`;
            let info = info_form.querySelector(".chat-info-form__attrs__text")
            info.firstElementChild.value = jsn.chat.name
            info.lastElementChild.innerHTML = jsn.chat.info
            let user_list = info_form.querySelector(".chat-info-form__user-list")
            user_list.innerHTML = ""
            user_list.scrollTop = 0
            if (jsn.chat.members) {
                for (let member of jsn.chat.members) {
                    if (member) {
                        user_list.innerHTML += `<div class="user-list__stroke-no-hover">
                <div class="user-list__stroke__user">
                    <img class="account-avatar" src=${member.ava_url} alt="user_avatar">
                    <div class="user-info-wrapper">
                        <h4>${member.name}</h4>
                        <p class="gray-text">${member.nick_name}</p>
                    </div>
                </div>
                <span class="iconify kick-icon" data-icon="ep:close-bold"></span>
            </div>`
                    }

                }
            }
        } else {
            error_handler(jsn.error)
        }
    }

    SendRequest("GET", `get_messages/${chat.id}`, "", Handler);
}

function Visible(targetList) {
    let TargetsAreVisible = false
    // Все позиции элемента
    let targetPosition
    let content = document.getElementsByClassName('current-chat-block__content')[0];

    targetList.forEach(function (target) {
        targetPosition = {
            top: window.screen.availHeight - target.offsetTop - 190,
            // left: window.scrollX + target.getBoundingClientRect().left,
            // right: window.scrollX + target.getBoundingClientRect().right,
            // bottom: window.scrollY + target.getBoundingClientRect().bottom
        },
            // Получаем позиции окна
            windowPosition = {
                top: -1 * content.scrollTop,
                // left: window.scrollX,
                // right: window.scrollX + document.documentElement.clientWidth,
                // bottom: window.scrollY + document.documentElement.clientHeight
            };
        console.log(targetPosition.top, windowPosition.top)
        if (targetPosition.top >= windowPosition.top) { // Если позиция левой стороны элемента меньше позиции правой чайти окна, то элемент виден справа
            console.log(target.innerHTML)
            TargetsAreVisible = true
            targetList.pop(target)
        } else {
            // Если target не видно, то запускаем этот код
        }
    })
    return TargetsAreVisible
}

SearchChats()

function SearchChats() {
    let userProf = document.getElementsByClassName('chats-wrapper__inner')[0].innerHTML;
    let data = [].slice.call(document.getElementsByClassName('chats-wrapper__inner')[0].children).map(function (chat) {
        return {name: chat.dataset.name, in_html: chat.innerHTML, out_html: chat.outerHTML}
    });
    document.getElementById('chats-wrapper-search-input').oninput = function () {
        chats_wrapper = document.getElementsByClassName('chats-wrapper__inner')[0];
        console.log(data);
        chats_wrapper.innerHTML = '';
        let searchText = this.value.toLowerCase();
        if (searchText !== '') {
            for (let i = 0; i < data.length; i++) {
                let Name = data[i].name.toLowerCase();
                if (Name.includes(searchText)) {
                    chats_wrapper.innerHTML += data[i].out_html;
                    chats_wrapper.lastElementChild.innerHTML = data[i].in_html;
                }
            }
        } else {
            chats_wrapper.innerHTML = userProf;
        }
        chats = chats_wrapper.querySelectorAll('.chat-wrapper__inner__stroke')
        chats.forEach(function (chat) {
            chat.addEventListener("click", function (e) {
                getMessages(chat)
            });
        })
    };
}

function selectClickEvent(message, content) {
    message.addEventListener('click', function () {
        console.log(this.offsetTop - window.screen.availHeight + 205)
        if (this.classList.contains('me')) {
            this.classList.toggle('is-selected')
        }
        let selectedMessages = content.querySelectorAll('.is-selected')
        let selectionCount = selectedMessages.length.toString()
        const interface = document.querySelector('.current-chat-block__header__interface')
        const deleteBtn = document.querySelector('#cancel-selection')
        const cancelBtn = document.querySelector('#delete-messages')
        if (selectedMessages.length > 0) {
            showItem(interface)
            deleteBtn.innerHTML = 'Отмена <span class="gray-text left-margin">' + " " + selectionCount + '</span>'
            cancelBtn.innerHTML = 'Удалить <span class="gray-text left-margin">' + " " + selectionCount + '</span>'

        } else {
            hideItem(interface)
        }
        deleteBtn.addEventListener('click', function () {
            selectedMessages.forEach(function (selected) {
                selected.classList.remove('is-selected')
                hideItem(interface)
            })
        })
        cancelBtn.addEventListener('click', function () {
            selectedMessages.forEach(function (selected) {
                //удаление выбарнных сообщений
                // selected.forEach( function (message){
                //     console.log(message)
                // })
                console.log(selected)
                selected.classList.remove('is-selected')
                hideItem(interface)
            })
        })
    })
}

let addContactTimer
document.getElementById('add-contact-search-input').oninput = function () {
    clearTimeout(addContactTimer)
    addContactTimer = setTimeout(() => {
        wrapper = document.querySelector('#add-contact-popup').querySelector('.add-contact-form__user-list');
        console.log(wrapper)
        wrapper.innerHTML = '';
        let searchText = this.value.toLowerCase();
        let stringLength = searchText.length;
        if (stringLength > 1) {
            function Handler(Request) {
                console.log(Request)
                for (let usr of Request.users) {
                    wrapper.innerHTML += `<div class="user-list__stroke-no-hover">
                <div class="user-list__stroke__user">
                    <img class="account-avatar" src="${usr.avatar_url}" alt="user_avatar">
                    <div class="user-info-wrapper">
                        <h4>${usr.name}</h4>
                        <p class="gray-text">${usr.nickname}</p>
                    </div>
                </div>
                <button data-user-id="${usr.id}" class="submit-button btn-add">Добавить</button>
            </div>`
                }
                $('.btn-add').click(function () {
                    btn = this
                    $.ajax({
                        type: 'GET',
                        url: `/im/add_contact?id=${this.dataset.userId}`,
                        processData: false,
                        contentType: false,
                        success: function (Request) {

                            $(btn).addClass('btn-added')
                            $(btn).text('Добавлено')
                            btn1 = btn.cloneNode(true);
                            user = btn.closest(".user-list__stroke-no-hover")
                            user.removeChild(btn)
                            user.appendChild(btn1)
                            socket.send(JSON.stringify({
                                'type': 'add_chat',
                                'user_id': Request.id,
                            }));
                        }
                    });

                })
            }

            $.ajax({
                type: 'GET',
                url: `/users/get_users?search_string=${searchText}`,
                processData: false,
                contentType: false,
                success: Handler
            });
        } else {
            wrapper.innerHTML = "";
        }
    }, 300);

};


function ReadMess(id, count) {
    $.ajax({
        type: 'GET',
        url: `/im/read?id=${id}&count=${count}`,
        processData: false,
        contentType: false,
        success: function (Request) {
            if (!Request.error) {

            } else {
                error_handler(Request.error)
            }

        }
    });
}