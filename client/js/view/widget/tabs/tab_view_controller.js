/// <reference path="../../../config/config.js" />
/// <reference path="../../../utilities/utilities.js" />
/// <reference path="../../../utilities/dom_utilities.js" />

/**
 * @typedef {object} TabViewControllerType
 * @property {() => boolean} isViewAttached
 * @property {() => TabViewControllerType} attachView
 * @property {() => TabViewControllerType} detachView
 * @property {() => boolean} isViewShowing
 * @property {() => TabViewControllerType} showView
 * @property {() => TabViewControllerType} hideView
 * @property {() => boolean} isListening
 * @property {() => TabViewControllerType} startListening
 * @property {() => TabViewControllerType} stopListening
 * @property {(tab: HTMLElement) => TabViewControllerType} activateTab
 */

/**
 * Controller for tab view:
 * 
 * When a tab is clicked, it is activated and the sibling tabs are
 * deactivated.  The content associated with the selected tablink
 * element (specified as a css selector in the element's 
 * data-tabcontent attribute) is shown.  Likewise, the tabcontent 
 * of sibling tablink elements is hidden.  
 * 
 * If a messageBus is supplied to the constructor, then 'tabActivated' 
 * and 'tabDeactivated' messages are published on the bus.
 * The data for the message is the tabcontent selector specified
 * in the tablink element's data-tabcontent attribute.  
 * Your code should expect the a message will be sent for each
 * tablink element (specifically, the a tabDeactivated message will be 
 * sent even if the tab is already deactivated).  
 * You code should_not_ assume any ordering for how the tabActivated 
 * and tabDeactivate messages are sent.
 * 
 * const viewController = TabViewController(cssTabContainer, cssTabLink);
 * viewController.attachView();     // select DOM under view control
 * viewController.startListening(); // attach event handlers to DOM
 * viewController.showView();       // show the DOM
 * // View is showing
 * viewController.hideView();       // hide the DOM
 * viewController.stopListening();  // remove event handlers
 * viewController.detachView();     // clear references to DOM
 * 
 * @param {string} cssTabContainer 
 * @param {string} cssTabLinks 
 * @param {MessageBusType | null} messageBus 
 * @returns {TabViewControllerType}
 */
function TabViewController(cssTabContainer, cssTabLinks, messageBus = null) {
    /** @type {HTMLElement | null} */
    let _tabContainer = null;

    /** @type {NodeListOf<HTMLElement> | null} */
    let _tabLinks = null;

    /** @type {string[]} */
    let _tabContentSelector = [];

    /** @type {HTMLElement[]} */
    let _tabContent = [];

    /**
     * @summary Determine if dom elements have been attached.
     * @returns {boolean}
     */
    function isViewAttached() {
        return ((!!_tabContainer) && (!!_tabLinks));
    }

    /**
     * @summary Bind the controller to the associated DOM elements.
     * 
     * @description
     * This uses the css selectors that are passed to the constructor
     * to lookup the DOM elements that are used by the controller.
     * >> NOTE: attaching more than once is ignored.
     * 
     * @returns {TabViewControllerType} // this controller for fluent chain calling
     */
    function attachView() {
        if (isViewAttached()) {
            console.log("Attempt to attach tab view twice is ignored.");
            return self;
        }

        _tabContainer = document.querySelector(cssTabContainer);
        _tabLinks = _tabContainer.querySelectorAll(cssTabLinks);

        // collect that tab content associated with each tab
        _tabContent = [];
        _tabContentSelector = [];
        for (let i = 0; i < _tabLinks.length; i += 1) {
            // read value of data-tabcontent attribute
            _tabContentSelector.push(_tabLinks[i].dataset.tabcontent);
            _tabContent.push(document.querySelector(_tabContentSelector[i]))
        }
        if(_tabLinks.length > 0) {
            activateTab(_tabLinks[0]); // select the first tab, hide the others
        }

        return self;
    }

    /**
     * @summary Unbind the controller from the DOM.
     * 
     * @description
     * This releases the DOM elements that are selected
     * by the attachView() method.
     * >> NOTE: before detaching, the controller must stop listening.
     * 
     * @returns {TabViewControllerType} // this controller for fluent chain calling
     */
    function detachView() {
        if (isListening()) {
            console.log("Attempt to detachView while still listening is ignored.");
            return self;
        }

        _tabContainer = null;
        _tabLinks = null;
        _tabContent = [];
        _tabContentSelector = [];

        return self;
    }

    let _showing = 0;

    /**
     * @summary Determine if the view is showing.
     * 
     * @returns {boolean} // RET: true if view is showing 
     *                            false if view is hidden
     */
    function isViewShowing() {
        return _showing > 0;
    }
    
    /**
     * @summary Show/Enable the view.
     * 
     * @description
     * Show the attached DOM elements.
     * 
     * >> NOTE: the controller must be attached.
     * 
     * >> NOTE: keeps count of calls to start/stop, 
     *          and balances multiple calls;
     * 
     * @example
     * ```
     * showView()  // true == isViewShowing()
     * showView()  // true == isViewShowing()
     * hideView()  // true == isViewShowing()
     * hideView()  // false == isViewShowing()
     * ```
     * 
     * @returns {TabViewControllerType} this controller instance for fluent chain calling
     */
    function showView() {
        if (!isViewAttached()) {
            console.log("Attempt to show a detached view is ignored.");
            return self;
        }

        _showing += 1;
        if (1 === _showing) {
            show(_tabContainer);
        }

        return self;
    }

    /**
     * @summary Hide/Disable the view.
     * 
     * @description
     * Hide the attached DOM elements.
     * 
     * >> NOTE: the controller must be attached.
     * 
     * >> NOTE: keeps count of calls to start/stop, 
     *          and balances multiple calls;
     * 
     * @example
     * ```
     * showView()  // true == isViewShowing()
     * showView()  // true == isViewShowing()
     * hideView()  // true == isViewShowing()
     * hideView()  // false == isViewShowing()
     * ```
     * 
     * @returns {TabViewControllerType} this controller instance for fluent chain calling
     */
    function hideView() {
        if (!isViewAttached()) {
            console.log("Attempt to show a detached view is ignored.");
            return self;
        }

        _showing -= 1;
        if (0 === _showing) {
            hide(_tabContainer);
        }

        return self;
    }

    let _listening = 0;

    /**
     * @summary Determine if controller is listening for messages and DOM events.
     * 
     * @returns {boolean} true if listening for events,
     *                    false if not listening for events.
     */
    function isListening() {
        return _listening > 0;
    }

    /**
     * @summary Start listening for DOM events.
     * @description
     * This adds event listeners to attached dom elements.
     * 
     * >> NOTE: the view must be attached.
     * 
     * >> NOTE: This keeps count of calls to start/stop and balances multiple calls;
     * 
     * @example
     * ```
     * startListening() // true === isListening()
     * startListening() // true === isListening()
     * stopListening()  // true === isListening()
     * stopListening()  // false === isListening()
     * ```
     * 
     * @returns {TabViewControllerType} this controller instance for fluent chain calling
     */
    function startListening() {
        if (!isViewAttached()) {
            console.log("Attempt to start listening to detached view is ignored.");
            return self;
        }

        _listening += 1;
        if (1 === _listening) {
            if (_tabLinks) {
                _tabLinks.forEach(el => el.addEventListener("click", _onTabClick));
            }
        }

        return self;
    }

    /**
     * @summary Stop listening for DOM events.
     * @description
     * This removes event listeners from attached dom elements.
     * 
     * >> NOTE: the view must be attached.
     * 
     * >> NOTE: This keeps count of calls to start/stop and balances multiple calls;
     * 
     * @example
     * ```
     * startListening() // true === isListening()
     * startListening() // true === isListening()
     * stopListening()  // true === isListening()
     * stopListening()  // false === isListening()
     * ```
     * 
     * @returns {TabViewControllerType} this controller instance for fluent chain calling
     */
    function stopListening() {
        if (!isViewAttached()) {
            console.log("Attempt to stop listening to detached view is ignored.");
            return self;
        }

        _listening -= 1;
        if (0 === _listening) {
            if (_tabLinks) {
                _tabLinks.forEach(el => el.removeEventListener("click", _onTabClick));
            }
        }

        return self;
    }

    /**
     * @summary Activate a tab and deactivate the others
     * 
     * @description
     * This will activate/show the give tab and
     * hide/disable the others.  
     * The activated tab starts listening and the 
     * disabled tabs stop listening.
     * If a message bus has been provided, then a message
     * is published for each tab's new state, so that
     * other parts of the app can coordinate their 
     * behavior if necessary.
     * - publish `TAB_ACTIVATED(tabname)` message when a tas is activate
     * - publish `TAB_DEACTIVATED(tabname)` message when a tab is deactivated.
     * 
     * @param {HTMLElement} tab 
     * @returns {TabViewControllerType} this controller instance for fluent chain calling
     */
    function activateTab(tab) {
        for (let i = 0; i < _tabLinks.length; i += 1) {
            const tabLink = _tabLinks[i];
            if (tab === tabLink) {
                // activate this tab's content
                tabLink.classList.add("active");
                if (_tabContent[i]) {
                    show(_tabContent[i]);
                }
                if (messageBus) {
                    messageBus.publish(`TAB_ACTIVATED(${_tabContentSelector[i]})`);
                }
            } else {
                // deactivate this tab's content
                tabLink.classList.remove("active");
                if (_tabContent[i]) {
                    hide(_tabContent[i]);
                }
                if (messageBus) {
                    messageBus.publish(`TAB_DEACTIVATED(${_tabContentSelector[i]})`);
                }
            }
        }

        return self;
    }

    /**
     * @summary Event handler when a tab is clicked.
     * 
     * @description
     * When a table is clicked then activateTab() is called
     * for that tab, which enables it and disables the others.
     * 
     * @param {*} event 
     */
    function _onTabClick(event) {
        // make this tab active and all siblings inactive
        activateTab(event.target);
    }

    /** @type {TabViewControllerType} */
    const self = Object.freeze({
        "attachView": attachView,
        "detachView": detachView,
        "isViewAttached": isViewAttached,
        "showView": showView,
        "hideView": hideView,
        "isViewShowing": isViewShowing,
        "startListening": startListening,
        "stopListening": stopListening,
        "isListening": isListening,
        "activateTab": activateTab,
    });

    return self;
}