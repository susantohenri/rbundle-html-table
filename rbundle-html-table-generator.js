const no_of_cols = jQuery(`.number-of-columns`)
const no_of_rows = jQuery(`.number-of-rows`)
jQuery(`[class^="step-"]`).not(`[class="step-1"]`).hide()
rbundle_html_table_generate_shortcode()


no_of_cols.find(`[type="radio"]`).click(() => {
    no_of_cols.find(`.step-2`).show()
})
no_of_cols.find(`[type="text"].step-2`).keyup(function () {
    if (`static` !== no_of_cols.find(`[type="radio"]:checked`).val()) return false
    const val = parseInt(jQuery(this).val())
    if (0 > val) return false
    no_of_cols.find(`.step-3`).remove()
    for (var head = 0; head < val; head++) {
        no_of_cols.append(`<input class="step-3" style="margin: 5px 5px 0 0" type="text" name="header[]" placeholder="Header ${head + 1}">`)
    }
    no_of_cols.append(`<br class="step-3">`)
    for (var head = 0; head < val; head++) {
        no_of_cols.append(`<input class="step-3" style="margin: 5px 5px 0 0" type="text" name="body[]" placeholder="Body ${head + 1}">`)
    }
    no_of_cols.find(`[type="text"].step-3`).keyup(rbundle_html_table_generate_shortcode)
    rbundle_html_table_generate_shortcode()
})


no_of_rows.find(`[type="radio"]`).click(() => {
    no_of_rows.find(`.step-2`).show()
})
no_of_rows.find(`[type="text"].step-2`).keyup(rbundle_html_table_generate_shortcode)

jQuery(`.user-able-add-rows`).find(`[type="radio"]`).click(rbundle_html_table_generate_shortcode)
jQuery(`.user-able-delete-default-rows`).find(`[type="radio"]`).click(rbundle_html_table_generate_shortcode)

jQuery(`.table-id`).keyup(rbundle_html_table_generate_shortcode)

function rbundle_html_table_generate_shortcode() {
    var rbundle_html_table_generated_shortcode = [`[rbundle-html-table`, `]`]

    var athead = []
    var atbody = []
    for (var col = 0; col < jQuery(`.number-of-columns`).find(`[name="header[]"]`).length; col++) {
        var formula = jQuery(`.number-of-columns`).find(`[type="text"].step-3`).eq(col).val()
        if (formula.startsWith(`field`)) { }
        else formula = '`' + formula + '`'
        athead.push(formula)

        formula = jQuery(`.number-of-columns`).find(`[name="body[]"]`).eq(col).val()
        if (formula.startsWith(`field`)) { }
        else if (`current-year-dash-index` === formula) { }
        else if (formula.startsWith(`tax-years-field`)) { }
        else formula = '`' + formula + '`'
        atbody.push(formula)
    }

    const srow_count = jQuery(`.number-of-rows`).find(`[type="text"].step-2`).val()

    if (`yes` === jQuery(`.user-able-add-rows`).find(`[type="radio"]:checked`).val()) {
        atbody.unshift(`add-row`)
        atbody.push(`trash`)
        athead.unshift(``)
        athead.push(``)
    }

    if (`no` === jQuery(`[name="user_able_to_delete_default_rows"]:checked`).val()) {
        rbundle_html_table_generated_shortcode.splice(1, 0, ` restrict-delete-default-row="true"`)
    }
    const table_id = jQuery(`.table-id`).val()

    if (0 < athead.length) {
        const sthead = athead.join(`,`)
        rbundle_html_table_generated_shortcode.splice(1, 0, ` thead="${sthead}"`)

        const stbody = atbody.join(`,`)
        rbundle_html_table_generated_shortcode.splice(1, 0, ` tbody="${stbody}"`)

        if (`` !== srow_count) rbundle_html_table_generated_shortcode.splice(1, 0, ` row-count="${srow_count}"`)
        if (`` !== table_id) rbundle_html_table_generated_shortcode.splice(1, 0, ` id="${table_id}"`)
    } else rbundle_html_table_generated_shortcode = []
    jQuery(`#rbundle_html_table_generated_shortcode`).html(rbundle_html_table_generated_shortcode.join(``))
}