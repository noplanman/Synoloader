let { classes: Cc, interfaces: Ci, utils: Cu } = Components;

Cu.import("resource://SynoLoader/DownloadManager.js");
Cu.import("resource://SynoLoader/Notification.js");
Cu.import("resource://SynoLoader/Util.js");

if (typeof SL_Overlay === "undefined") {
    var SL_Overlay = {};

    (function () {
        this.firstRun = (extensions) => {
            let firstRunPref = "extensions.SynoLoader.firstRunDone";

            if (!Application.prefs.getValue(firstRunPref, false)) {
                Application.prefs.setValue(firstRunPref, true);

                let toolbar = document.getElementById("nav-bar");
                toolbar.insertItem("sl-toolbar", null);
                toolbar.setAttribute("currentset", toolbar.currentSet);
                document.persist(toolbar.id, "currentset");
            }
        };

        this.updateListPanel = () => {
            let panel = document.getElementById("sl-toolbar-panel"),
                label = document.getElementById("sl-toolbar-panel-label"),
                list = document.getElementById("sl-toolbar-panel-list"),
                box = document.getElementById("sl-toolbar-panel-box");

            if (label.getAttribute("value") !== "Loading...") {
                label.setAttribute("value", "Loading...");
            }

            DownloadManager.loadDownloadList(
                (items) => {
                    let loadedList = {};

                    if (typeof DownloadManager.protocol !== "undefined") {
                        loadedList = DownloadManager.protocol.calcItems(items);
                    }

                    let count = list.itemCount;
                    while (count-- > 0) {
                        list.removeItemAt(count);
                    }

                    if (loadedList.length === 0) {
                        box.setAttribute("hidden", "false");
                        label.setAttribute("value", "No active Downloads");
                        clearInterval(this.updateListPanelInterval);
                    } else {
                        for (let i in loadedList) {
                            list.appendChild(loadedList[i]);
                        }
                        box.setAttribute("hidden", "true");
                    }
                    list.removeItemFromSelection(0);
                    panel.moveTo(-1, -1);
                },
                (response) => {
                    box.setAttribute("hidden", "false");
                    label.setAttribute("value", "No Connection, please set correct Preferences");
                    clearInterval(this.updateListPanelInterval);
                    panel.moveTo(-1, -1);
                }
            );
        };

        this.showOptions = () => {
            window.open("chrome://SynoLoader/content/options.xul", "Preferences", "chrome=yes,toolbar=yes");
        };

        this.onLoad = () => {
            Util.log("SL_Overlay loaded");
            if (Application.extensions) {
                this.firstRun(Application.extensions);
            } else {
                Application.getExtensions(this.firstRun);
            }

            document.getElementById("contentAreaContextMenu").
                addEventListener("popupshowing", (event) => {
                    this.showFirefoxContextMenu(event);
                }, false);
            DownloadManager.connectToNas();
        };

        this.onMenuItemLinkCommand = (event) => {
            if (DownloadManager.isConnected) {
                window.open(DownloadManager.urlToConnect + "/webman/index.cgi?launchApp=SYNO.SDS.DownloadStation.Application", "Diskstation", this.strWindowFeatures);
            } else {
                Notification.show("No Connection");
            }
        };

        this.onMenuItemCommand = (event) => {
            if (DownloadManager.isConnected) {
                DownloadManager.transferToNas(gContextMenu.linkURL);
            } else {
                Notification.show("No Connection");
            }
        };

        this.onToolBarDownloadInfo = (event) => {
            this.updateListPanel();
            this.updateListPanelInterval = setInterval(() => {
                this.updateListPanel();
            }, 2500);
        };

        this.onToolBarDownloadInfoHidden = (event) => {
            clearInterval(this.updateListPanelInterval);
        };

        this.showFirefoxContextMenu = (event) => {
            document.getElementById("sl-context-menu").hidden = (!gContextMenu.onLink);
        };

    }).apply(SL_Overlay);

    window.addEventListener("load", function load (event) {
        window.removeEventListener("load", load, false); //remove listener, no longer needed
        SL_Overlay.onLoad();
    }, false);
}
