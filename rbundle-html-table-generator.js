const no_of_cols = jQuery(`.number-of-columns`)
const no_of_rows = jQuery(`.number-of-rows`)

jQuery(`[class^="step-"]`).not(`[class="step-1"]`).hide()

jQuery(`[name="user_able_to_import_export_csv"]`).click(() => {
    no_of_cols.find(`[type="text"].step-2`).trigger(`keyup`)
})
jQuery(`[name="table_header_tooltip"]`).click(() => {
    no_of_cols.find(`[type="text"].step-2`).trigger(`keyup`)
})
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
        no_of_cols.append(`<input class="step-3" style="margin: 5px 5px 0 0" type="text" name="header[]" placeholder="Header Column ${head + 1}">`)
    }
    no_of_cols.append(`<br class="step-3">`)
    for (var head = 0; head < val; head++) {
        no_of_cols.append(`<input class="step-3" style="margin: 5px 5px 0 0" type="text" name="body[]" placeholder="Body Column ${head + 1}">`)
    }
    if (`yes` === jQuery(`[name="user_able_to_import_export_csv"]:checked`).val()) {
        no_of_cols.append(`<br class="step-3">`)
        for (var head = 0; head < val; head++) {
            no_of_cols.append(`<input class="step-3" style="margin: 5px 5px 0 0" type="text" name="csv-header[]" placeholder="CSV Header Column ${head + 1}">`)
        }
        no_of_cols.append(`<br class="step-3">`)
        for (var head = 0; head < val; head++) {
            no_of_cols.append(`<input class="step-3" style="margin: 5px 5px 0 0" type="text" name="csv-body[]" placeholder="CSV Body Column ${head + 1}">`)
        }
    }
    if (`yes` === jQuery(`[name="table_header_tooltip"]:checked`).val()) {
        no_of_cols.append(`<br class="step-3">`)
        for (var head = 0; head < val; head++) {
            no_of_cols.append(`<input class="step-3" style="margin: 5px 5px 0 0" type="text" name="tooltip-header[]" placeholder="Tooltip Header Column ${head + 1}">`)
        }
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
    var acsv_thead = []
    var acsv_tbody = []
    var atooltip_thead = []
    for (var col = 0; col < jQuery(`.number-of-columns`).find(`[name="header[]"]`).length; col++) {
        var formula = jQuery(`.number-of-columns`).find(`[type="text"].step-3`).eq(col).val()
        if (formula.startsWith(`field`)) { }
        else if (formula.startsWith(`table|`)) { }
        else if (formula.startsWith(`table-in-page|`)) { }
        else formula = '`' + formula.replaceAll('`', ``) + '`'
        athead.push(formula)

        formula = jQuery(`.number-of-columns`).find(`[name="body[]"]`).eq(col).val().trim()
        if (formula.startsWith(`field`)) { }
        else if (`current-year-dash-index` === formula) { }
        else if (formula.startsWith(`tax-years-field`)) { }
        else if (formula.startsWith(`dropdown:`)) { }
        else if (formula.startsWith(`dropdown-by-field`)) { }
        else if (`index` === formula) { }
        else if (`read-only-index` === formula) { }
        else if (`zipcode-validation` === formula) { }
        else if (`%percent` === formula) { }
        else if (`date-picker` === formula) { }
        else if (formula.indexOf(`currency-format`) > 1) { }
        else if (formula.startsWith(`if`)) { }
        else if (formula.startsWith(`table|`)) { }
        else if (formula.startsWith(`table-in-page|`)) { }
        else if (`current-year` === formula) { }
        else if (formula.startsWith(`current-year-minus-`)) { }
        else if (formula.startsWith(`today-tax-year-by-field`)) { }
        else if (formula.startsWith(`tax-year-end-by-field`)) { }
        else if (`TY-dash-index` === formula) { }
        else if (formula.startsWith(`TY-dash-index-minus-`)) { }
        else if (`n/a-read-only` === formula) { }
        else if (formula.startsWith(`fed-tax-dl-column-`)) { }
        else if (formula.startsWith(`fed-tr-amend-open-column`)) { }
        else if (formula.startsWith(`column-`)) { }
        else formula = '`' + formula.replaceAll('`', ``) + '`'
        atbody.push(formula)

        acsv_thead.push(jQuery(`.number-of-columns`).find(`[name="csv-header[]"]`).eq(col).val())
        acsv_tbody.push(jQuery(`.number-of-columns`).find(`[name="csv-body[]"]`).eq(col).val())

        atooltip_thead.push(jQuery(`.number-of-columns`).find(`[name="tooltip-header[]"]`).eq(col).val())
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

        if (`yes` === jQuery(`[name="user_able_to_import_export_csv"]:checked`).val()) {
            const scsv_thead = acsv_thead.join(`,`)
            rbundle_html_table_generated_shortcode.splice(1, 0, ` thead-data-csv="${scsv_thead}"`)

            const scsv_tbody = acsv_tbody.join(`,`)
            rbundle_html_table_generated_shortcode.splice(1, 0, ` tbody-data-csv="${scsv_tbody}"`)
        }

        if (`yes` === jQuery(`[name="table_header_tooltip"]:checked`).val()) {
            const stooltip_thead = atooltip_thead.join(`,`)
            rbundle_html_table_generated_shortcode.splice(1, 0, ` thead-data-tooltip="${stooltip_thead}"`)

        }
        if (`` !== srow_count) rbundle_html_table_generated_shortcode.splice(1, 0, ` row-count="${srow_count}"`)
        if (`` !== table_id) rbundle_html_table_generated_shortcode.splice(1, 0, ` id="${table_id}"`)
    } else rbundle_html_table_generated_shortcode = []
    jQuery(`#rbundle_html_table_generated_shortcode`).html(rbundle_html_table_generated_shortcode.join(``))
}

jQuery(`#run_reverse_formula`).click(function (event) {
    event.preventDefault()
    jQuery(`#reverse_formula_error`).html(``)
    var formula = jQuery(`#reverse_formula`).val()
    var error_message = `shortcode incomplete or invalid`
    if (0 !== formula.indexOf(`[rbundle-html-table`)) jQuery(`#reverse_formula_error`).html(error_message)

    jQuery(`[name="user_able_to_import_export_csv"][value="${-1 < formula.indexOf(`-data-csv`) ? `yes` : `no`}"]`).click()
    jQuery(`[name="table_header_tooltip"][value="${-1 < formula.indexOf(`thead-data-tooltip`) ? `yes` : `no`}"]`).click()
    jQuery(`[name="number of columns"][value="static"]`).click()
    const user_able_to_add_row = -1 < formula.indexOf(`add-row`)
    jQuery(`[name="user_able_to_add_rows"][value="${user_able_to_add_row ? `yes` : `no`}"]`).click()
    jQuery(`[name="user_able_to_delete_default_rows"][value="${-1 < formula.indexOf(`restrict-delete-default-row="true"`) ? `no` : `yes`}"]`).click()

    for (const attr of [`id`, `thead`, `tbody`, `thead-data-csv`, `tbody-data-csv`, `thead-data-tooltip`, `restrict-delete-default-row`, `row-count`]) {
        if (0 > formula.indexOf(`${attr}="`)) continue;
        const attr_value = formula.split(`${attr}="`)[1].split(`"`)[0]
        switch (attr) {
            case `id`:
                jQuery(`.table-id`).val(attr_value)
                    ; break
            case `thead`:
                var ths = attr_value.split(`,`)
                ths = user_able_to_add_row ? ths.slice(1, -1) : ths
                jQuery(`[name="value number of columns"]`).val(ths.length).trigger(`keyup`)
                for (var thi = 0; thi <= ths.length; thi++) jQuery(`[name="header[]"]`).eq(thi).val(undefined == ths[thi] ? `` : ths[thi].replaceAll('`', ``)).trigger(`keyup`)
                    ; break
            case `tbody`:
                var tds = attr_value.split(`,`)
                tds = user_able_to_add_row ? tds.slice(1, -1) : tds
                for (var tdi = 0; tdi <= tds.length; tdi++) jQuery(`[name="body[]"]`).eq(tdi).val(undefined == tds[tdi] ? `` : tds[tdi].replaceAll('`', ``)).trigger(`keyup`)
                    ; break
            case `thead-data-csv`:
                var tds = attr_value.split(`,`)
                for (var tdi = 0; tdi <= tds.length; tdi++) jQuery(`[name="csv-header[]"]`).eq(tdi).val(undefined == tds[tdi] ? `` : tds[tdi].replaceAll('`', ``)).trigger(`keyup`)
                    ; break
            case `tbody-data-csv`:
                var tds = attr_value.split(`,`)
                for (var tdi = 0; tdi <= tds.length; tdi++) jQuery(`[name="csv-body[]"]`).eq(tdi).val(undefined == tds[tdi] ? `` : tds[tdi].replaceAll('`', ``)).trigger(`keyup`)
                    ; break
            case `thead-data-tooltip`:
                var tds = attr_value.split(`,`)
                for (var tdi = 0; tdi <= tds.length; tdi++) jQuery(`[name="tooltip-header[]"]`).eq(tdi).val(undefined == tds[tdi] ? `` : tds[tdi].replaceAll('`', ``)).trigger(`keyup`)
                    ; break
            case `row-count`:
                jQuery(`[name="number of rows"]`).eq(!isNaN(attr_value) ? 0 : 1).click()
                jQuery(`[name="value number of rows"]`).val(attr_value).trigger(`keyup`)
                    ; break
        }
    }
})