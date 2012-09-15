//
// TODO : Animate the tooltip callout movement in sync with the cursor line.  This is proving challenging to do via the Wijmo tooltip.
// TODO : Draw markers where the cursors intersect the line series.
//

(function ($) {

    $.widget("bw.wijlinechartcursor", $.wijmo.wijlinechart, {
        options: {
            cursorStyle: { stroke: "#ff9900", "stroke-width": 2, opacity: 0.8, fill: "#000000", "fill-opacity": 0.5 },
            cursorCalloutTitleStyle: { fill: "#d1d1d1", "font-size": 10 },
            cursorCalloutContentStyle: { fill: "#d1d1d1", "font-size": 12 },

            getCursorCalloutTitle: function () {
                return this.markers[0].valX;
            },

            getCursorCalloutContent: function () {
                var sContent = "";
                $.each(this.markers, function (i, marker) {
                    if (sContent) {
                        sContent += ", ";
                    }
                    sContent += marker.lineSeries.label + ":" + marker.valY;
                });
                return sContent;
            }
        },
        _create: function () {
            var self = this;
            $.wijmo.wijlinechart.prototype._create.apply(self, arguments);

            self.cursorMouseHover = null;
            self.cursors = [];

            self.element.on(self.widgetEventPrefix + "painted", function (e) {
                self.cursorMouseHover = self._createCursorElements();
                $.each(self.cursors, function (index, cursor) {
                    // TODO BW : Refine this some.
                    cursor.marker = self.getVirtualLineMarker(0, cursor.marker.index);
                    cursor.path = self._createCursorPath(cursor.marker.x); 
                    self._paintCursor(cursor);
                });
            });
        },

        _createCursorElements: function () {
            var self = this;
            // Create the cursor Raphael path.
            //
            var cursorPath = self._createCursorPath().hide();

            // Create the tooltip callout using the Raphael extension up in the wijchartcore base.
            //
            var tooltip = self.canvas.tooltip(null, {
                enable: true,
                style: self.options.cursorStyle,
                contentStyle: self.options.cursorCalloutContentStyle,
                titleStyle: self.options.cursorCalloutTitleStyle,
                animated: null,
                showDelay: 0, hideDelay: 0, showDuration: 0, hideDuration: 0, duration: 0,
                calloutAnimation: { easing: ">", duration: 50} // This doesn't seem to have any effect.
            });

            return { path: cursorPath, tooltip: tooltip, marker: null };
        },

        _createCursorPath: function (offsetX) {
            var path = this.getCanvas().path("M 0 " + this.canvasBounds.startY + " L 0 " + this.canvasBounds.endY).attr(this.options.cursorStyle);
            if (offsetX) {
                path.transform("t" + offsetX + ",0");
            }
            return path;
        },

        _mouseMoveInsidePlotArea: function (e, mousePos) {
            var self = this;
            $.wijmo.wijlinechart.prototype._mouseMoveInsidePlotArea.apply(self, arguments);
            var nearestMarker = self.getNearestVirtualLineMarker(mousePos);
            self.cursorMouseHover.marker = nearestMarker;
            self._paintCursor(self.cursorMouseHover);
        },

        _paintCursor: function (cursor) {
            var self = this;

            // Move the mouse hover cursor.
            //
            if (!cursor) return;

            cursor.path.animate({ transform: "t" + cursor.marker.x + ",0" }, 75, '>').show();
            self._paintCursorToolTip(cursor);
        },

        _paintCursorToolTip: function (cursor) {
            var self = this;
            var nearestMarkers = [];
            $.each(self.seriesList, function (index, series) {
                nearestMarkers.push(self.getVirtualLineMarker(index, cursor.marker.index));
            });

            var tooltipOptions = cursor.tooltip.getOptions();

            // Create an object to manifest as 'this' in the callback.
            //
            var callbackObject = {
                markers: nearestMarkers,
                fnTitle: self.options.getCursorCalloutTitle,
                fnContent: self.options.getCursorCalloutContent
            };

            tooltipOptions.title = function () {
                if (callbackObject.fnTitle) {
                    return callbackObject.fnTitle();
                }
            }

            tooltipOptions.content = function () {
                if (callbackObject.fnContent) {
                    return callbackObject.fnContent();
                }
            }

            cursor.tooltip.showAt({ x: nearestMarkers[0].x, y: self.canvasBounds.startY });
        },

        getNearestVirtualLineMarker: function (position) {
            var virtualMarkers = this.getVirtualLineMarkers(0);
            if (!virtualMarkers || !virtualMarkers.length) return;

            var nearestMarker;
            var shortestDistance = Infinity;
            // Find the closest virtual marker to the position.  This does a linear search... it would be better if it were binary.
            //
            $.each(virtualMarkers, function (index, marker) {
                var distance = Math.abs(marker.x - position.left);
                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestMarker = marker;
                }
                else return false; // Break the .each loop.  No need to continue, we found the closest.
            });

            return nearestMarker;
        },

        getVirtualLineMarkers: function (lineIndex) {
            return $(this.getLinePath(lineIndex).node).data().wijchartDataObj.virtualMarkers;   // What a mess.  Not sure why Wijmo makes this so hard to get at.  Is there an easier way?
        },

        getVirtualLineMarker: function (lineIndex, markerIndex) {
            return this.getVirtualLineMarkers(lineIndex)[markerIndex];
        },

        _mouseMoveOutsidePlotArea: function (e, mousePos) {
            var self = this;
            $.wijmo.wijlinechart.prototype._mouseMoveOutsidePlotArea.apply(self, arguments);

            self.hidePositionCursor(self.cursorMouseHover);
        },

        showPositionCursor: function (markerIndex, cursor) {
            if (!cursor) {
                cursor = this._createCursorElements();
                this.cursors.push(cursor);
            }
            cursor.marker = this.getVirtualLineMarker(0, markerIndex);
            this._paintCursor(cursor);
            return cursor;
        },

        hidePositionCursor: function (cursor) {
            if (!cursor) return;
            cursor.path.hide();
            if (cursor.tooltip) {
                cursor.tooltip.hide();
            }
            var iCursor = this.cursors.indexOf(cursor);
            if (-1 != iCursor) {
                console.log("Cursor #" + iCursor + " deleted.");
                this.cursors.splice(iCursor, 1);
            }
        }
    });

} (jQuery));
