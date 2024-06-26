
window.addEventListener('click', e => {
	const target = e.target

	// Скрытие открытие шапки

	if (target.closest('.header__btn-mob, .header__nav-close')) {
		$('.header__nav').toggleClass('show');
		$('.hamburger-lines').toggleClass('close');
	};

	// Выбор языка
	if (target.closest('.switch-lang__curr, .switch-lang__item') || (!target.closest('.switch-lang__list.show') && $(document).find('.switch-lang__list').hasClass('show'))) {
		$('.switch-lang__list').toggleClass('show');
	}
})


$(document).ready(function () {


	if ($("#lightgallery").length > 0) {
		$("#lightgallery").lightGallery();
		$("#lightgallery1").lightGallery();
	}

	$(document.body).click(function () {
		$(".lg-image").each(function () {
			if ($(this).css("opacity") === "1") { $('.admin').show(); }
			else {
				$('.admin').hide();
			}

		})
	});
});


$(document).find('.example-work__grid .example-work__item').each(function (number) {

	let numberHTML = `<div class="example-work__number">${number + 1}</div>`
	$(this).append(numberHTML)
})