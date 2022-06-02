let create_chat_form = document.getElementById('create-chat-popup');

let create_chat_name = null;
create_chat_form.addEventListener("submit", createChat);

const popupLinks = document.querySelectorAll('.js-popup-link'),
    overlay = document.getElementById('overlay-popup'),
    popupClosers = document.querySelectorAll('.js-popup-close'),
    dropDownsContents = document.querySelectorAll('.js-dropdown-content'),
    popupBacks = document.querySelectorAll('.js-popup-back')

sideBar = $('.chats-wrapper')


popupLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
        const popupName = link.getAttribute('href').replace('#', '')
        const currentPopup = document.getElementById(popupName)
        popupOpen(currentPopup)
        event.preventDefault();
    });
})

popupClosers.forEach(function (closer) {
    closer.addEventListener('click', function (event) {
        document.querySelectorAll('.js-popup').forEach(function (popup) {
            popupClose(popup)
        })
    });
})

popupBacks.forEach(function (back) {
    back.addEventListener('click', function (event) {
        popupBack(back.closest('.js-popup'))
    })
})

function popupOpen(popup) {
    sideBar.removeClass('is-active')
    if (popup) {
        const popupActive = document.querySelector('popup.is-show')
        if (popupActive) {
            popupClose(popupActive)
        }
        popup.classList.add('is-show')
        overlay.classList.add('is-show')
        overlay.addEventListener('click', function (event) {
            popupClose(popup)
        })
        if (popup.id == 'create-chat-popup') {
            getContacts();
        }
    }
}

function popupClose(popup) {
    if (popup) {
        popup.querySelector('input').value = ''
        popup.classList.remove('is-show')
        overlay.classList.remove('is-show')
        create_chat_contacts_ids = []
        create_chat_name = null
    }
}

function popupBack(popup) {
    if (popup) {
        popup.querySelector('input').value = ''
        popup.classList.remove('is-show')
    }
}

const createChatForm = document.querySelector('.create-chat-form')
const chatTitleInput = createChatForm.querySelector('#create-chat-input-name')

const userStrokes = document.querySelectorAll('.user-list__stroke')

// userStrokes.forEach(function (stroke) {
//     stroke.addEventListener('click', function (event) {
//         console.log('После меня появится галочка')
//         toggleCheck(stroke.querySelector('.checkbox'))
//         console.log('После меня должна быть проверка')
//         checkCreateChatForm()
//     });
// })

chatTitleInput.addEventListener('input', function () {
    checkCreateChatForm()
})

function checkCreateChatForm() {
    const checkbox = createChatForm.querySelector('.is-checked')
    if (checkbox && chatTitleInput.value !== '') {
        console.log('OKEY')
        createChatForm.querySelector('.create-btn').disabled = false
    } else {
        console.log('NOT OKEY')
        createChatForm.querySelector('.create-btn').disabled = true
    }
}


function getContacts() {
    const Handler = function (Request) {
        let jsn = JSON.parse(Request.response);
        let strokes;
        let user_list;
        let user;
        let user_info;
        let checkbox;
        if (!jsn.error) {
            console.log(jsn);
            user_list = document.getElementsByClassName('create-chat-form__user-list')[0];
            user_list.innerHTML = "";
            for (const key in jsn.chats) {
                user = document.createElement('div');
                user.className = 'user-list__stroke';
                user.dataset.name = jsn.chats[key].name;
                user_info = document.createElement('div');
                user_info.className = 'user-list__stroke__user';
                user_info.innerHTML = `<img class="account-avatar" src="${jsn.chats[key].ava_url}" alt="user_avatar">\n`;
                user_info_inner = document.createElement('div');
                user_info_inner.className = 'user-info-wrapper';
                user_info_inner.innerHTML = `<h4>${jsn.chats[key].name}</h4>` +
                    `<p class=\"gray-text\">${jsn.chats[key].nick_name}</p>\n`;
                checkbox = document.createElement('div');
                checkbox.classList.add('checkbox');
                checkbox.setAttribute('data-chat-id', jsn.chats[key].id);
                checkbox.innerHTML = '<img class="check-icon" src="/static/images/check.svg" alt="Галочка">'
                user_info.appendChild(user_info_inner);
                user.appendChild(user_info);
                user.appendChild(checkbox);
                // user.addEventListener('click', function (event) {
                //     toggleCheck(user.querySelector('.checkbox'))
                //     checkCreateChatForm()
                // });
                user_list.appendChild(user);
            }
            strokes = document.querySelectorAll('.user-list__stroke')
            strokes.forEach(function (stroke) {
                stroke.addEventListener('click', function (event) {
                    toggleCheck(stroke.querySelector('.checkbox'))
                    checkCreateChatForm()
                    event.preventDefault();
                });
            })
            console.log(user_list.innerHTML)
            SearchCreateChatContacts()
        } else {
            error_handler(jsn.error)
        }
    };

    SendRequest("GET", `get_contacts`, "", Handler);

}


function SearchCreateChatContacts() {
    let userProf = document.querySelector('.create-chat-form__user-list').innerHTML;
    let data = [].slice.call(document.querySelector('.create-chat-form__user-list').children).map(function (user) {
        return {name: user.dataset.name, in_html: user.innerHTML, out_html: user.outerHTML}
    });
    document.getElementById('create-chat-search').oninput = function () {
        user_list = document.querySelector('.create-chat-form__user-list');
        user_list.innerHTML = '';
        let searchText = this.value.toLowerCase();
        if (searchText !== '') {
            for (let i = 0; i < data.length; i++) {
                let Name = data[i].name.toLowerCase();
                if (Name.includes(searchText)) {
                    user_list.innerHTML += data[i].out_html;
                    user_list.lastElementChild.innerHTML = data[i].in_html;
                }
            }
        } else {
            user_list.innerHTML = userProf;
        }
        users = user_list.querySelectorAll('.user-list__stroke')
        users.forEach(function (user) {
            user.addEventListener("click", function (event) {
                toggleCheck(user.querySelector('.checkbox'))
                checkCreateChatForm()
                event.preventDefault();

            });
        })
    };
}

function toggleCheck(checkbox) {
    if (checkbox) {
        checkbox.classList.toggle('is-checked')
        checkbox.firstElementChild.classList.toggle('is-show')
        if (create_chat_contacts_ids.indexOf(checkbox.dataset.chatId) != -1) {
            create_chat_contacts_ids.splice(create_chat_contacts_ids.indexOf(checkbox.dataset.chatId), 1);
        } else {
            create_chat_contacts_ids.push(checkbox.dataset.chatId);
        }
    }
}


function createChat() {
    let ids = new Array()
    form = document.querySelector('.create-chat-form');
    form.querySelectorAll(".user-list__stroke").forEach(function (user) {
        console.log(user)
        checkbox = user.querySelector(".is-checked")
        if (checkbox) {
            ids.push(checkbox.dataset.chatId)
        }
    })
    const data = new FormData(form);
    const Handler = function (Request) {
        picture = form.querySelector('.image-input')
        picture.nextElementSibling.querySelector(".display-image").style.backgroundImage = `url(../static/images/user_avatar.png)`;
        form.querySelector("#create-chat-input-name").value = ""
        form.querySelector("#create-chat-input-name").value = ""
        if (!Request.error) {
            socket.send(JSON.stringify({
                'type': 'add_chat',
                'chat_id': Request.chat_id,
            }));
            popupClose(form);
        } else {
            error_handler(Request.error)
        }
    };

    user_list = form.querySelector(".create-chat-form__user-list")
    user_list.innerHTML = `<h4 class="initialMessage">Создаем чат...<br><progress value="0" max="100"></progress></h4>`
    $.ajax({
        type: 'POST',
        url: `/im/create_chat`,
        data: data,
        processData: false,
        contentType: false
    }).then(function (result) {
        user_list.innerHTML = `<h4 class="initialMessage">Чат создан! Добавляем участников.<br>Прогресс: 1/${ids.length+1}<br><progress value="${100/(ids.length+1)}" max="100"></progress></h4>`
        promise = $.when();
        $.each(ids, function (index, id) {
            promise = promise.then(function () {
                return $.ajax(`add_member_to_chat/chat${result.chat_id}/${id}`);
            }).then(function (result) {
                user_list.innerHTML = `<h4 class="initialMessage">Чат создан! Добавляем участников.<br>Прогресс: ${index+2}/${ids.length + 1}<br><progress value="${100/(ids.length+1)*(index+2)}" max="100"></progress></h4>`
                console.log(JSON.stringify(result));
            }, function (result){
                alert(result.responseJSON.error)
                location.reload();
            });
        });
        promise.then(function () {
            Handler(result)
            user_list.innerHTML = `<h4 class="initialMessage">Завершено!</progress></h4>`
        });
    }, function (result) {
        alert(result.responseJSON.error)
        location.reload();
    });
}

function error_handler(error) {
    if (error == "Not auth") {
        location.reload()
    } else {
        alert(error)
    }
}

//sidebar
$('#chats-sidebar-link').on('click', function () {
    sideBar.addClass('is-active')
    overlay.classList.add('is-show')
})

overlay.addEventListener('click', function () {
    overlay.classList.remove('is-show')
    sideBar.removeClass('is-active')
})

$('.chat-wrapper__inner__stroke').click(function () {
    sideBar.removeClass('is-active')
    overlay.classList.remove('is-show')
})

//Добавление контактов
//
// $('.btn-add').click(function () {
//     $(this).addClass('btn-added')
//     $(this).text('Добавлено')
// })

//Дропдауны
activateDropDowns()

function activateDropDowns() {
    $('.js-dropdown').each(function () {
        console.log($('.this'))
        let timerId;

        $(this).mouseleave(function () {
            timerId = setTimeout(() => {
                $(this).children('.js-dropdown-content').addClass('is-fade')
                $(this).children('.js-dropdown-content').removeClass('is-show')
            }, 200);

        })
        $(this).mouseenter(function () {
            clearTimeout(timerId)
            setTimeout(() => {
                $(this).children('.js-dropdown-content').addClass('is-show')
                $(this).children('.js-dropdown-content').removeClass('is-fade')
            }, 100);
        })
    })
}

// photoInput
const imageInputs = document.querySelectorAll(".image-input");
imageInputs.forEach(function (input) {
    input.addEventListener("change", function () {
        console.log('changed')
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            console.log('loaded')
            const uploadedImage = reader.result;
            input.nextElementSibling.querySelector(".display-image").style.backgroundImage = `url(${uploadedImage})`;
        });
        reader.readAsDataURL(this.files[0]);
    });
})
const imageInput = document.querySelector(".image-input");

//clear-input
$('.search-input').on('input', function () {
    let clearBtn = $(this).siblings('.clear-input').first()
    if ($(this).val() !== '') {
        clearBtn.addClass('is-show')
        clearBtn.removeClass('is-fade')
        clearBtn.on('click', function () {
            clearBtn.siblings('input').val('')
            $('.search-input').trigger('input')
        })
    } else {
        clearBtn.removeClass('is-show')
        clearBtn.addClass('is-fade')
    }
})
//
// document.querySelectorAll('.search-input').forEach(function (input){
//     input.addEventListener('input', function (){
//         console.log('а вот так существует')
//     })
// })

//bodyClickChecker
// document.body.addEventListener('click', function (e) {
//     console.log(e.target)
// })

function dropAllSelections(selectedItems) {
    selectedItems.forEach(function (item) {
        item.classList.remove('is-selected')
    })
}

function showItem(item) {
    item.classList.add('is-show')
    item.classList.remove('is-fade')
}

function hideItem(item) {
    item.classList.remove('is-show')
    item.classList.add('is-fade')
}















