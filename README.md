This is an example of extending the Wijmo wijlinechart widget in order to render vertical cursor bars on the graph.  This works best with multi-series Y data points that share common X axis coordinates.  As you mouse over the plot area, the cursor will snap to the nearest x coordinate and display the Y values in a tooltip callout associated with the cursor.

You can also manually set additional cursors in code.  This was something I needed for a project I was working on that had 'playback' semantics.  The cursor advances as the sequence progresses through the data points.

Demo: http://brandonlwhite.github.com/WijmoLineChartCursor/WijLineChartCursorDemo.html