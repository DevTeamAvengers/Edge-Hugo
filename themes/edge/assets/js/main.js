/**
 * Toggle tab.
 * @param {jQuery} $trigger
 * @returns {Void}
 */
function toggleTab($trigger) {
	const $container = $trigger.closest('.js-tabs');
	const $tab = $container.find(' > .tabs__body > .tab')
		.eq($trigger.parent().index());

	$trigger.parent()
		.addClass('current')
	.siblings()
		.removeClass('current');

	$tab.show()
		.siblings()
		.hide();
}

$('.js-tabs > .tabs__head .tabs__nav a').on('click', function(e) {
	e.preventDefault();

	toggleTab($(this));
});

/**
 * Fetch code block.
 * @param {String} url
 * @returns {Promise}
 */
function fetchCodeBlock(url) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            dataType: 'text',
            success: function(data) {
                try {
                    resolve(data);
                } catch (e) {
                    reject(new Error('Failed to stringify data: ' + e.message));
                }
            },
            error: function(xhr, status, error) {
                reject(new Error(`Error ${xhr.status}: ${xhr.statusText}`));
            }
        });
    });
}

$('pre[data-ajax]').each(function() {
	const url = $(this).data('ajax');
	const $codeContainer = $(this).find('code');

	fetchCodeBlock(`.${url}`)
		.then(codeBlocks => {
			$codeContainer.text(codeBlocks);

			Prism.highlightElement($codeContainer[0]);
		})
		.catch(error => {
			console.error(error);
		});
});

/**
 * Set CSS Variable.
 * @param {String} name
 * @param {Number} value
 * @param {String} unit
 * @param {jQuery} $element
 * @returns {Void}
 */
function setCSSVariable(name, value, unit = '', $element = $('html')) {
	$element.css(`--${name}`, `${value}${unit}`);
}

setCSSVariable('header-height', $('.header').outerHeight(), 'px');

$(window).on('resize', function(e) {
	setCSSVariable('header-height', $('.header').outerHeight(), 'px');
});