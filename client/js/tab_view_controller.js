//////// Rover Control UI ///////////
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
 */
function TabViewController(cssTabContainer, cssTabLinks, messageBus = null) {
    let tabContainer = null;
    let tabLinks = null;
    let tabContentSelector = [];
    let tabContent = [];

    function attachView() {
        if (isViewAttached()) {
            console.log("Attempt to attach tab view twice is ignored.");
            return self;
        }

        tabContainer = document.querySelector(cssTabContainer);
        tabLinks = tabContainer.querySelectorAll(cssTabLinks);

        // collect that tab content associated with each tab
        tabContent = [];
        tabContentSelector = [];
        for (let i = 0; i < tabLinks.length; i += 1) {
            tabContentSelector.push(tabLinks[i].dataset.tabcontent);
            tabContent.push(document.querySelector(tabContentSelector[i]))
        }

        return self;
    }

    function detachView() {
        if (isListening()) {
            console.log("Attempt to detachView while still listening is ignored.");
            return self;
        }

        tabContainer = null;
        tabLinks = null;
        tabContent = [];
        tabContentSelector = [];

        return self;
    }

    function isViewAttached() {
        return (tabContainer && tabLinks);
    }

    let showing = 0;

    function showView() {
        if (!isViewAttached()) {
            console.log("Attempt to show a detached view is ignored.");
            return self;
        }

        showing += 1;
        if (1 === showing) {
            show(tabContainer);
        }

        return self;
    }

    function hideView() {
        if (!isViewAttached()) {
            console.log("Attempt to show a detached view is ignored.");
            return self;
        }

        showing -= 1;
        if (0 === showing) {
            hide(tabContainer);
        }

        return self;
    }

    function isViewShowing() {
        return showing > 0;
    }

    let listening = 0;

    function startListening() {
        if (!isViewAttached()) {
            console.log("Attempt to start listening to detached view is ignored.");
            return self;
        }

        listening += 1;
        if (1 === listening) {
            if (tabLinks) {
                tabLinks.forEach(el => el.addEventListener("click", onTabClick));
            }
        }

        return self;
    }

    function stopListening() {
        if (!isViewAttached()) {
            console.log("Attempt to stop listening to detached view is ignored.");
            return self;
        }

        listening -= 1;
        if (0 === listening) {
            if (tabLinks) {
                tabLinks.forEach(el => el.removeEventListener("click", onTabClick));
            }
        }

        return self;
    }

    function isListening() {
        return listening > 0;
    }

    function activateTab(tab) {
        for (let i = 0; i < tabLinks.length; i += 1) {
            const tabLink = tabLinks[i];
            if (tab === tabLink) {
                // activate this tab's content
                tabLink.classList.add("active");
                if (tabContent[i]) {
                    show(tabContent[i]);
                }
                if (messageBus) {
                    messageBus.publish(`TAB_ACTIVATED(${tabContentSelector[i]})`);
                }
            } else {
                // deactivate this tab's content
                tabLink.classList.remove("active");
                if (tabContent[i]) {
                    hide(tabContent[i]);
                }
                if (messageBus) {
                    messageBus.publish(`TAB_DEACTIVATED(${tabContentSelector[i]})`);
                }
            }
        }

        return self;
    }

    function onTabClick(event) {
        // make this tab active and all siblings inactive
        activateTab(event.target);
    }


    const self = {
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
    }
    return self;
}