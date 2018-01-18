import Gradient from 'zrender/src/graphic/Gradient';

function applyColors (colorFns, data, seriesModel, idx) {
    return Object.keys(colorFns).forEach(function (fnKey) {
        data.setItemVisual(
            idx, fnKey, colorFns[fnKey](seriesModel.getDataParams(idx))
        );
    });
}

export default {
    createOnAllSeries: true,
    performRawSeries: true,
    reset: function (seriesModel, ecModel) {
        var data = seriesModel.getData();
        var colorAccessPath = (seriesModel.visualColorAccessPath || 'itemStyle.color').split('.');
        var borderColorAccessPath = ['itemStyle', 'borderColor'];
        var shadowColorAccessPath = ['itemStyle', 'shadowColor'];

        var color = seriesModel.get(colorAccessPath) // Set in itemStyle
            || seriesModel.getColorFromPalette(
                // TODO series count changed.
                seriesModel.get('name'), null, ecModel.getSeriesCount()
            );  // Default color
        var borderColor = seriesModel.get(borderColorAccessPath);

        // FIXME Set color function or use the platte color
        data.setVisual('color', color);
        data.setVisual('borderColor', borderColor);

        // Only visible series has each data be visual encoded
        if (!ecModel.isSeriesFiltered(seriesModel)) {
            var colors = {
                color: color,
                borderColor: borderColor,
                shadowColor: seriesModel.get(shadowColorAccessPath)
            };

            var colorFns = Object.keys(colors).reduce(function (acc, color) {
                var col = colors[color];

                if (typeof col === 'function' && !(col instanceof Gradient)) {
                    acc[color] = col;
                }

                return acc;
            }, {});

            var applyVisuals = applyColors.bind(null, colorFns, data, seriesModel);
            data.each(applyVisuals);

            // itemStyle in each data item
            var dataEach = function (data, idx) {
                var itemModel = data.getItemModel(idx);
                var itemModels = {
                    color: itemModel.get(colorAccessPath, true),
                    borderColor: itemModel.get(borderColorAccessPath, true),
                    shadowColor: itemModel.get(shadowColorAccessPath, true)
                };

                Object.keys(itemModels).forEach(function (name) {
                    var itemModel = itemModels[name];
                    if (itemModel != null) {
                        data.setItemVisual(idx, name, itemModel);
                    }
                });
            };

            return { dataEach: data.hasItemOption ? dataEach : null };
        }
    }
};
