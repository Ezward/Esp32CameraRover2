//
///////////////// dom utilities //////////////
//

// Hide the element
const hide = el => {
    el.classList.add('hidden')
}

// show the element
const show = el => {
    el.classList.remove('hidden')
}

// disable the element
const disable = el => {
    el.classList.add('disabled')
    el.disabled = true
}

// enable the element
const enable = el => {
    el.classList.remove('disabled')
    el.disabled = false
}