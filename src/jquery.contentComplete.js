/*
 * jquery.contentComplete.js
 * By Thomas Schreiber <thomas@cel.ly>
 * Copyright (c) 2014 Celly
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

(function( $ ) {
    var ContentComplete = function(element, settings) {
        var self = this;
        var element = element;
        var $elem = $(element);
        var anchorNode;
        var anchorOffset;
        var selectedIdx = 0;
        var currentElement = element;
        var currentWord = "";
        var currentListLength = 0;

        // When these keys are pressed down we want to handle them specially
        $elem.keydown(function(e) {
            if (currentWord != "") {
                if (e.which == 9) {
                    // Tab
                    e.preventDefault();
                    process();
                } else if (e.which == 13) {
                    // Enter
                    e.preventDefault();
                    process();
                } else if (e.which == 27) {
                    // Escape
                    e.preventDefault();
                    hide();
                    placeCursorAt(anchorNode, anchorOffset);
                } else if (e.which == 38) {
                    // Up Arrow
                    e.preventDefault();
                    if (selectedIdx > 0) {
                        selectedIdx = selectedIdx - 1;
                        highlightSelected();
                    }
                } else if (e.which == 40) {
                    // Down Arrow
                    e.preventDefault();
                    if (selectedIdx < currentListLength-1) {
                        selectedIdx = selectedIdx + 1;
                        highlightSelected();
                    }
                }
            }
        });

        // when most any key comes up we want to do some processing
        $elem.keyup(function(e) {
            var isShift = e.shiftKey ? true : false;
            getCursorPosition();

            // if it's the shift key we don't care
            if (e.which == 16) {
                return;
            }

            // if it's space, comma, or period we want to stop processing
            if (e.which == 32 || e.which == 188 || e.which == 186) {
                hide();
            } else {
                // we don't want to intercept space or the special keys above
                if (e.which != 32 && e.which != 9 && e.which != 13
                    && e.which != 27 && e.which != 38 && e.which != 40) {
                    var prefix = getCurrentWord($elem.html());
                    currentWord = prefix;
                    hide();
                    if (isShift && e.which == 50) {
                        // Typed "@"
                        currentWord = "@";
                        prefix = "@";
                    } else if (isShift && e.which == 51) {
                        // Typed "#"
                        currentWord = "#";
                        prefix = "#";
                    }
                    if (prefix.substring(0,1) == "@") {
                        getCompletions(prefix);
                    } else if (prefix.substring(0,1) == "#") {
                        getCompletions(prefix);
                    }
                }
            }
        });

        // hide the autocomplete list
        var hide = function() {
            $(".wordCompleteList").remove();
            selectedIdx = 0;
            currentListLength = 0;
        };
        
        // if you click anywhere, but an element hide the autocomplete list
        $(document).click(function() {
            hide();
        });

        // update the classes to match the currently selected element
        var highlightSelected = function() {
            $(".wordCompleteItem").removeClass("autocomplete-selected");
            $("#wordCompleteIdx"+selectedIdx).addClass("autocomplete-selected");
        };

        // update the current word with the chosen word
        var process = function(idxToProcess) {
            var $selected = $("#wordCompleteIdx"+selectedIdx);
            if (typeof idxToProcess !== "undefined") {
                $selected = $("#wordCompleteIdx"+idxToProcess);
            }
            var newWord = $selected.attr('nameValue');
            replaceCurrentWordWith(newWord);
            hide();
            currentWord = "";
            return false;
        };
        
        // get possible completions for a prefix string
        var getCompletions = function(prefix) {
            var fetchOptions = {};
            fetchOptions.method = 'GET';
            fetchOptions.contentType = 'application/x-www-form-urlencoded';
            if (settings.localTest) {
                fetchOptions.mimeType = 'application/json; charset=x-user-defined';
            }
            if (prefix.substring(0,1) == "@") {
                fetchOptions.url = settings.atEndpoint + prefix;
                fetchOptions.success = function(response) {
                    drawList(response.results);
                };

            } else if (prefix.substring(0,1) == "#") {
                fetchOptions.url = settings.hashEndpoint + prefix;
                fetchOptions.success = function(response) {
                    drawListHash(response.results);
                  }
            }
            $.ajax(fetchOptions);
        };

        // draw the list for hash completions
        var drawListHash = function (list) {
            var $list = $('<div>').addClass('wordCompleteList');
            var idx = 0;

            $list.css("width", "225px");
            $list.css("border", "solid 1px #CCC");
            $list.css("min-height", "50px");
            $list.css("background-color", "rgba(248, 248, 238, 0.5)");
            $list.css("z-index", "5000");
            $list.css("float", "left");
            $list.css("position", "absolute");
            $list.css("margin-left", "2px");
            $list.css("margin-top", "2px");

            for (idx=0; idx<list.length; idx++) {
                    var $wrapper = $("<div>")
                            .addClass("wordCompleteItem")
                            .addClass("autocomplete-suggestion")
                            .attr("id", "wordCompleteIdx"+idx)
                            .attr("nameValue", list[idx]);
                    var $item = $("<div>").addClass("suggestion");

                    $("<div>"+ list[idx] +"</div>").addClass("suggestion_full_name").appendTo($item);

                    $("<div>").addClass("fs").appendTo($item);
                    $item.appendTo($wrapper);
                    $wrapper.appendTo($list);
            }

            if (list.length < 1) {
                if (settings.showNoResults) {
                    var $item = $("<div>");
                    $("<p>no results found</p>").appendTo($list);
                } else {
                    return;
                }
            }

            $elem.after($list);

            bindItems();
            highlightSelected();
            currentListLength = list.length - 2;

        };

        // draw the list for '@' completions
        var drawList = function (list) {
            var $list = $('<div>').addClass('wordCompleteList');
            var idx = 0;

            $list.css("width", "225px");
            $list.css("border", "solid 1px #CCC");
            $list.css("min-height", "50px");
            $list.css("background-color", "rgba(248, 248, 238, 0.5)");
            $list.css("z-index", "5000");
            $list.css("float", "left");
            $list.css("position", "absolute");
            $list.css("margin-left", "2px");
            $list.css("margin-top", "2px");

            for (idx=0; idx<list.length; idx++) {
                    var $wrapper = $("<div>")
                            .addClass("wordCompleteItem")
                            .addClass("autocomplete-suggestion")
                            .attr("id", "wordCompleteIdx"+idx)
                            .attr("nameValue", list[idx]);
                    var $item = $("<div>").addClass("suggestion");

                    $("<div>"+ list[idx] +"</div>").addClass("suggestion_full_name").appendTo($item);

                    $("<div>").addClass("fs").appendTo($item);
                    $item.appendTo($wrapper);
                    $wrapper.appendTo($list);
            }
            if (list.length < 1) {
                if (settings.showNoResults) {
                    var $item = $("<div>");
                    $("<p>no results found</p>").appendTo($list);
                } else {
                    return;
                }
            }

            $elem.after($list);

            bindItems();
            highlightSelected();
            currentListLength = list.length - 2;
        };

        // bind the items to events
        var bindItems = function() {
            $('.wordCompleteItem').mouseover(function() {
                var thisId = $(this).attr("id");
                selectedIdx = parseInt(thisId.substring(15, thisId.length),10);
                highlightSelected();
            });
            $('.wordCompleteItem').click(function() {
                process();
                return false;
            });
        };

        // replace the current word with a given word
        var replaceCurrentWordWith = function(newWord) {
            var currentText = anchorNode.nodeValue;
            anchorNode.nodeValue = currentText.substring(0,
                    anchorOffset-currentWord.length) +
                    newWord +
                    currentText.substring(anchorOffset,currentText.length);
            placeCursorAt(anchorNode, anchorOffset-currentWord.length + newWord.length);
        }
        
        // place the cursor at a given spot in a contenteditable div
        var placeCursorAt = function(node, pos) {
            $(currentElement).focus();
            var sel = window.getSelection();
            var range = sel.getRangeAt(0);
            range.collapse(true);
            range.setStart(node,pos);
            sel.removeAllRanges();
            sel.addRange(range);
        }

        // stores the current cursor position so it can be reset later
        var getCursorPosition = function() {
            var sel;
            if (window.getSelection && (sel = window.getSelection()).modify) {
                anchorNode = sel.anchorNode;
                anchorOffset = sel.anchorOffset;
            }
        };

        // get the word at around the current cursor position
        var getCurrentWord = function() {
            var sel, word = "";
            if (window.getSelection && (sel = window.getSelection()).modify) {
                var selectedRange = sel.getRangeAt(0);
                sel.collapseToStart();
                sel.modify("move", "backward", "word");
                sel.modify("move", "backward", "character");
                sel.modify("extend", "forward", "word");

                word = sel.toString();

                // Restore selection
                sel.removeAllRanges();
                sel.addRange(selectedRange);
            } else if ( (sel = document.selection) && sel.type != "Control") {
                var range = sel.createRange();
                range.collapse(true);
                range.expand("word");
                word = range.text;
            }
            currentWord = word;
            return word;
        };
    };

    // register as a jquery method
    $.fn.contentComplete = function(options) {
        var settings = $.extend({
            // defaults
            atEndpoint: "at.json?query=",     // endpoint for '@' completions
            hashEndpoint: "hash.json?query=", // endpoint for '#' completions
            localTest: false,                 // this just lets the static example work
            showNoResults: false              // display no results or just hide list?
        }, options);

        return this.each(function() {
            var contentComplete = new ContentComplete(this, settings);
        });
    };

}( jQuery ));
