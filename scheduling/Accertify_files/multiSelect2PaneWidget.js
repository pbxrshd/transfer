// multi select 2 pane widget support

var MultiSelect2PaneWidget = {
    displayNumOfItemsInAvailPane : function(paneId, availPaneCounter) {
        var noSelInAvailPane = 0;
        var noItemsInAvailPane = 0;
        var paneRef = document.getElementById(paneId);
        if (paneRef.hasChildNodes()) {
            for (var i = 0; i < paneRef.length; i++) {
                noItemsInAvailPane ++;
                if (paneRef[i].selected) {
                    noSelInAvailPane ++;
                }
            }
        }

        var message = document.getElementById(availPaneCounter).innerHTML;
        message = this.formatMessage(message, [noSelInAvailPane, noItemsInAvailPane]);
        document.getElementById(availPaneCounter).innerHTML = message;
    },
    displayNumOfItemsInChosenPane : function(paneId, chosenPaneCounter) {
        var noItemsInChosenPane = 0;
        var paneRef = document.getElementById(paneId);
        if (paneRef.hasChildNodes()) {
            for (var i = 0; i < paneRef.length; i++) {
                noItemsInChosenPane ++;
            }
        }

        var message = document.getElementById(chosenPaneCounter).innerHTML;
        message = this.formatMessage(message, [noItemsInChosenPane]);
        document.getElementById(chosenPaneCounter).innerHTML = message;
    },
    filterAvailablePaneItems : function(paneId, dropdownFilters, textFilter, availPaneCounter, tmpPaneId) {
        var tmpPaneRef = document.getElementById(tmpPaneId);
        var paneRef = document.getElementById(paneId);

        var dValues = [];
        if (dropdownFilters != null) {
            for (var i = 0; i < dropdownFilters.length; i ++) {
                var d = document.getElementById(dropdownFilters[i]);
                var dValue = d.options[d.selectedIndex].value;
                dValues.push(dValue);
            }
        }

        var tValue = document.getElementById(textFilter).value.toLowerCase();

        if (tmpPaneRef.hasChildNodes()) {
            for (var i = tmpPaneRef.length - 1; i >= 0;  i--) {
                paneRef.appendChild(tmpPaneRef[i]);
            }
        }

        if (paneRef.hasChildNodes()) {
            for (var i = paneRef.length - 1; i >= 0; i--) {
                var optionAttr = paneRef[i].getAttribute("class");
                var optionText = paneRef[i].text.toLowerCase();

                var noMatched = false;

                for (var j = 0; j < dValues.length; j ++) {
                    if (dValues[j] != '' && optionAttr.indexOf(dValues[j]) == -1) {
                        noMatched = true;
                        break;
                    }
                }

                if (tValue != '' && optionText.indexOf(tValue) == -1) {
                    noMatched = true;
                }

                if (noMatched) {
                    paneRef[i].selected = false;
                    tmpPaneRef.appendChild(paneRef[i]);
                }
            }
        }

        this.sortSelectByText(paneRef);

        this.displayNumOfItemsInAvailPane(paneId, availPaneCounter);
    },
    // move selected from avail to chosen
    moveAvailableToChosen : function(availablePaneId, availableSelectAllCheckBox, availPaneCounter,
                                     chosenPaneId, chosenSelectAllCheckBox, chosenPaneLabel) {
        var availRef = document.getElementById(availablePaneId);
        var chosenRef = document.getElementById(chosenPaneId);
        var chosenInsertionPoint = (chosenRef.selectedIndex != -1) ? chosenRef[chosenRef.selectedIndex]: null;
        if (availRef.selectedIndex != -1) {
            var refsToMove = [];
            for (var i = 0; i < availRef.length; i++) {
                if (availRef[i].selected) {
                    availRef[i].selected = false;
                    refsToMove.push(availRef[i]);
                }
            }
            refsToMove.forEach(function(e){chosenRef.insertBefore(e,chosenInsertionPoint);});
        }

        document.getElementById(availableSelectAllCheckBox).checked = false;
        document.getElementById(chosenSelectAllCheckBox).checked = false;

        this.displayNumOfItemsInAvailPane(availablePaneId, availPaneCounter);
        this.displayNumOfItemsInChosenPane(chosenPaneId, chosenPaneLabel);
    },
    // move selected from chosen back to avail
    moveChosenToAvailable : function (chosenPaneId, chosenSelectAllCheckBox, chosenPaneLabel,
                                      availablePaneId, availableSelectAllCheckBox, availPaneCounter,
                                      dropdownFilters, textFilter, tmpPaneId) {
        var availRef = document.getElementById(availablePaneId);
        var chosenRef = document.getElementById(chosenPaneId);
        if (chosenRef.selectedIndex != -1) {
            var newAvailFrame = [];
            if (availRef.hasChildNodes()) {
                for (var i = 0; i < availRef.length; i++) {
                    newAvailFrame.push(availRef[i]);
                    availRef.removeChild(availRef[i]);
                }
            }

            var selectedByIndex = [];
            for (var i = 0; i < chosenRef.length; i++) {
                selectedByIndex[i] = chosenRef[i].selected;
                var currentChosenRef = chosenRef[i];
                if (currentChosenRef.selected) {
                    currentChosenRef.selected = false;
                    newAvailFrame.push(currentChosenRef);
                }
            }

            var l = chosenRef.length;
            while (l--) {
                if (selectedByIndex[l]) {
                    chosenRef.remove(l);
                }
            }

            for (var i = 0; i < newAvailFrame.length; i++) {
                availRef.appendChild(newAvailFrame[i]);
            }

            this.sortSelectByText(availRef);
        }

        document.getElementById(chosenSelectAllCheckBox).checked = false;
        document.getElementById(availableSelectAllCheckBox).checked = false;

        this.filterAvailablePaneItems(availablePaneId, dropdownFilters, textFilter, availPaneCounter, tmpPaneId);

        this.displayNumOfItemsInChosenPane(chosenPaneId, chosenPaneLabel);
    },
    moveChosenUp : function(chosenPaneId) { // move selected from chosen one place up
        var chosenRef = document.getElementById(chosenPaneId);
        if (chosenRef.selectedIndex != -1) {
            var selectedRef = chosenRef[chosenRef.selectedIndex];
            var prevRef = selectedRef.previousElementSibling;
            if (prevRef) {
                chosenRef.insertBefore(selectedRef,prevRef);
            }
        }
    },
    moveChosenDown : function(chosenPaneId) { // move selected from chosen one place down
        var chosenRef = document.getElementById(chosenPaneId);
        if (chosenRef.selectedIndex != -1) {
            var selectedRef = chosenRef[chosenRef.selectedIndex];
            var nextRef = selectedRef.nextElementSibling;
            if (nextRef) {
                chosenRef.insertBefore(nextRef,selectedRef);
            }
        }
    },
    toggleSelectAllItems : function(paneId, selectAllCheckboxId, availablePaneId, availPaneCounter) {
        var selected = document.getElementById(selectAllCheckboxId).checked;
        this.selectAllItems(paneId, selected);
        if (paneId == availablePaneId) {
            this.displayNumOfItemsInAvailPane(availablePaneId, availPaneCounter);
        }
    },
    selectAllItems : function(paneId, selected) {
        var paneRef = document.getElementById(paneId);
        if (paneRef.hasChildNodes()) {
            for (var i = 0; i < paneRef.length; i++) {
                paneRef[i].selected = selected;
            }
        }
    },
    sortSelectByText : function(selElem) {
        var tmpAry = [];
        for (var i=0;i<selElem.options.length;i++) {
            tmpAry[i] = [];
            tmpAry[i][0] = selElem.options[i].text;
            tmpAry[i][1] = selElem.options[i].value;
            tmpAry[i][2] = selElem.options[i].getAttribute("class");
            tmpAry[i][3] = selElem.options[i].getAttribute("title");
        }
        tmpAry.sort();
        while (selElem.options.length > 0) {
            selElem.options[0] = null;
        }
        for (var i=0;i<tmpAry.length;i++) {
            var op = new Option(tmpAry[i][0], tmpAry[i][1]);
            selElem.options[i] = op;
            selElem.options[i].setAttribute("class", tmpAry[i][2]);
            selElem.options[i].setAttribute("title", tmpAry[i][3]);
        }
    },
    formatMessage: function(message, replacements) {
        var tokens = message.split(" ");
        var replaceIndex = 0;
        for (var i = 0; i < tokens.length; i ++) {
            if (jQuery.isNumeric(tokens[i])) {
                tokens[i] = replacements[replaceIndex++];
            }
        }

        return tokens.join(" ");
    }
}
