jQuery(`table.rbundle-html-table`).each(function () {
    const table = jQuery(this)
    const table_id = table.attr(`id`)
    if (!table_id || 1 < jQuery(`table#${table_id}`).length) table.attr(`id`, Math.random().toString().replace(`0.`, ``))
    rbundle_html_table_draw_table(table)
})

function rbundle_html_table_draw_table(table) {
    const dt_options = {
        ordering: false
        , paging: false
        , searching: false
        , info: false
    }

    // prepare empty thead cells
    const thead = table.attr(`thead`).split(`,`)
    const thead_length = thead.length
    dt_options.columnDefs = []
    for (var head_idx = 0; head_idx < thead_length; head_idx++) dt_options.columnDefs.push({
        title: ``, targets: head_idx
    })

    const dt = new DataTable(table, dt_options)
    if (0 < thead_length) {
        rbundle_html_table_update_thead(thead, dt, table)
        if (undefined !== table.attr(`tbody`)) {
            rbundle_html_table_update_tbody(thead_length, table.attr(`tbody`).split(`,`), dt, table, null)
        }
    }
}

function rbundle_html_table_update_thead(thead, dt, table) {
    for (var th = 0; th < thead.length; th++) {
        rbundle_html_table_update_thead_cell(th, thead[th], dt, table)
    }
    rbundle_html_table_update_thead_special_case_csv(table)
    rbundle_html_table_update_thead_special_case_tooltip(table)
}

function rbundle_html_table_update_thead_cell(th, formula, dt, table) {
    const table_id = table.attr(`id`)
    var result = ``

    // if no attribute tbody
    if (undefined === formula) return false
    formula = formula.trim()

    // tbody=",,`N/A`, `153`,,"
    if ('`' === formula.charAt(0) && '`' === formula.slice(-1)) {
        result = formula.substring(1, formula.length - 1)
    }

    // tbody=",,field1243,,"
    else if (formula.startsWith(`field`)) {
        const field = jQuery(`[name="item_meta[${formula.replace(`field`, ``)}]"]`)
        if (field.length > 0) {
            result = field.val()
            field
                .off(`change.rbundle_html_table_update_thead_cell_${table_id}`)
                .on(`change.rbundle_html_table_update_thead_cell_${table_id}`, function () {
                    rbundle_html_table_update_thead_cell(th, formula, dt, table)
                })
        }
    }
    else if (formula.startsWith(`table-in-page|`)) rbundle_html_table_table_in_page(table, dt)
    jQuery(dt.column(th).header()).text(result)
}

function rbundle_html_table_update_tbody(thead_length, tbody, dt, table, data) {
    var row_count = 0
    if (data) row_count = data.length
    else {
        row_count = table.attr(`row-count`)
        row_count = rbundle_html_table_custom_row_count(table, dt, row_count, function () {
            rbundle_html_table_update_tbody(thead_length, tbody, dt, table, data)
        })
    }

    var body = []
    for (var tr = 0; tr < row_count; tr++) {
        body[tr] = []
        for (var td = 0; td < thead_length; td++) body[tr][td] = ``
    }
    dt.clear()
    dt.rows.add(body).draw()

    if (!data) {
        if (table.attr(`restrict-delete-default-row`)) table.find(`tbody tr`).attr(`default-row`, true)
        table.find(`tbody tr`).each(function () {
            jQuery(this).attr(`read-only-index`, jQuery(this).index() + 1)
        })
    } else for (var d_idx = 0; d_idx < data.length; d_idx++) {
        if (data[d_idx].attributes) for (var attr of data[d_idx].attributes) {
            table.find(`tbody tr`).eq(d_idx).attr(attr.name, attr.value)
        }
    }

    for (var tr = 0; tr < row_count; tr++) {
        for (var td = 0; td < thead_length; td++) {
            const predefined = data ? data[tr][td] : null
            if (undefined !== tbody[td]) rbundle_html_table_update_tbody_cell(tr, td, tbody[td], dt, table, predefined)
        }
    }

    rbundle_html_table_update_tbody_special_case_csv(table)
    rbundle_html_table_fed_tr_amend(table, dt, `rbundle_html_table_update_tbody`, false)
}

function rbundle_html_table_custom_row_count(table, dt, row_count, redraw_body) {
    const table_id = table.attr(`id`)
    // row-count="current-year-minus-field840" => 2023 (current year) - 2022 (input value) + 1 (include current year) = 2 row
    if (row_count.startsWith(`current-year-minus-field`)) {
        var result = 0
        const field_id = row_count.replace(`current-year-minus-field`, ``)
        const field = jQuery(`[name="item_meta[${field_id}]"]`)
        if (field.length > 0) {
            result = `` === field.val() ? 0 : parseInt((new Date()).getFullYear()) - parseInt(field.val()) + 1
            field
                .off(`change.rbundle_html_table_custom_row_count_${table_id}`)
                .on(`change.rbundle_html_table_custom_row_count_${table_id}`, redraw_body)
        }
        return result
    }
    /* row-count="field4163" */
    /* row-count="field4163+field4165-field3345" */
    else if (row_count.startsWith(`field`)) {
        var result = 0;
        var operator = `+`
        row_count.split(`field`).forEach(function (field_id, index, arr) {
            if (0 === index) return;
            const last_char = field_id.slice(-1)
            if (index !== arr.length - 1) field_id = field_id.slice(0, -1)

            const field = jQuery(`[name="item_meta[${field_id}]"]`)
            if (field.length > 0) {
                const val = `` === field.val() ? 0 : parseInt(field.val())
                switch (operator) {
                    case `+`: result += val; break
                    case `-`: result -= val; break
                    case `*`: result *= val; break
                }
                field
                    .off(`change.rbundle_html_table_custom_row_count_${table_id}`)
                    .on(`change.rbundle_html_table_custom_row_count_${table_id}`, redraw_body)
            }

            if ([`+`, `-`, `*`].indexOf(last_char) > -1) operator = last_char
        })
        return result
    }

    else if (row_count.startsWith(`fed-tr-amend-open-column`)) {
        return 1
    }
    else if (row_count.startsWith(`table-in-page|`)) {
        rbundle_html_table_table_in_page(table, dt)
        return 1
    }
    else return row_count
}

function rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table, predefined) {
    if (1 > table.find(`tbody`).find(`tr`).eq(tr).find(`td`).eq(td).length) return false

    const table_id = table.attr(`id`)
    var result = ``
    var contenteditable = true

    const is_datepicker = `date-picker` === formula
    if (is_datepicker) formula = formula.replace(`date-picker`, ``)

    const is_currency = formula.indexOf(`currency-format`) > -1
    if (is_currency) formula = formula.replace(`currency-format`, ``).trim()

    formula = formula.trim()

    // tbody=",,`N/A`, `153`,,"
    if ('`' === formula.charAt(0) && '`' === formula.slice(-1)) {
        if (`` === result) result = formula.substring(1, formula.length - 1)
    }

    // tbody=",,current-year,,"
    else if (`current-year` === formula) {
        result = parseInt((new Date()).getFullYear())
        contenteditable = false
    }

    // tbody=",,n/a-read-only,,"
    else if (`n/a-read-only` === formula) {
        result = `N/A`
        contenteditable = false
    }

    // tbody=",,field###-slash-current-year-minus-index,,"
    else if (formula.startsWith(`field`) && formula.endsWith(`-slash-current-year-minus-index`)) {
        const field = jQuery(`[name="item_meta[${formula.replace(`field`, ``).replace(`-slash-current-year-minus-index`, ``)}]"]`)
        if (field.length > 0) {
            if (`` === result) {
                const field_value = field.val()
                const current_year = parseInt(new Date().getFullYear())
                const index = parseInt(tr) + 1
                const current_year_minus_index = current_year - index
                result = `${field_value}/${current_year_minus_index}`
            }
            field
                .off(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`)
                .on(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`, function () {
                    rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table, predefined)
                })
        }
    }

    // tbody=",,field###-slash-current-year,,"
    else if (formula.startsWith(`field`) && formula.endsWith(`-slash-current-year`)) {
        const field = jQuery(`[name="item_meta[${formula.replace(`field`, ``).replace(`-slash-current-year`, ``)}]"]`)
        if (field.length > 0) {
            if (`` === result) result = field.val() + `/` + parseInt((new Date()).getFullYear())
            field
                .off(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`)
                .on(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`, function () {
                    rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table, predefined)
                })
        }
    }

    // tbody=",,field1243,,"
    else if (formula.startsWith(`field`)) {
        const field = jQuery(`[name="item_meta[${formula.replace(`field`, ``)}]"]`)
        if (field.length > 0) {
            if (`` === result) result = field.val()
            field
                .off(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`)
                .on(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`, function () {
                    rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table, predefined)
                })
        }
    }

    // tbody=",,trash,,"
    else if (`trash` === formula) {
        if (`` === result) result = `<i class="fas fa-sm fa-solid fa-trash"></i>`
        contenteditable = false
    }

    // tbody=",,add-row,,"
    else if (`add-row` === formula) {
        if (`` === result) result = `<input type="button" value="+">`
        contenteditable = false
    }

    // tbody=",,current-year,,"
    else if (`current-year` === formula) {
        result = parseInt((new Date()).getFullYear())
        contenteditable = false
    }

    // tbody=",,current-year-minus-field238,,"
    else if (formula.startsWith(`current-year-minus-field`)) {
        const field_id = formula.replace(`current-year-minus-field`, ``)
        const field = jQuery(`[name="item_meta[${field_id}]"]`)
        if (field.length > 0) {
            field
                .off(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`)
                .on(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`, function () {
                    rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table, predefined)
                })
            const value = field.val()
            const current_year = parseInt((new Date()).getFullYear())
            if (`` === result) result = current_year - value
        }
    }

    // tbody=",,current-year-minus-12,,"
    else if (formula.startsWith(`current-year-minus-`)) {
        result = parseInt((new Date()).getFullYear()) - parseInt(formula.replace(`current-year-minus-`, ``))
        contenteditable = false
    }

    // tbody=",,current-year-dash-index,," => Current year - 2
    else if (`current-year-dash-index` === formula) {
        if (`` === result) result = `Current year - ${tr}`
        contenteditable = false
    }

    // tbody=",,tax-years-field238,," => 12/31/2022
    else if (formula.startsWith(`tax-years-field`)) {
        const field_id = formula.replace(`tax-years-field`, ``)
        const field = jQuery(`[name="item_meta[${field_id}]"]`)
        if (field.length > 0) {
            field
                .off(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`)
                .on(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`, function () {
                    rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table, predefined)
                })
            const value = field.val()
            const current_year = parseInt((new Date()).getFullYear())
            if (`` === result) result = `${value}/${current_year - tr}`
        }
    }

    // tbody=",,dropdown-by-field2734,,"
    else if (formula.startsWith(`dropdown-by-field`)) {
        const field = jQuery(`select[name="item_meta[${formula.replace(`dropdown-by-field`, ``)}]"]`)
        if (field.length > 0) {
            const field_value = field.val()
            var options = []
            field.find(`option`).each(function () {
                const option = jQuery(this)
                const value = option.prop(`value`)
                const opt = `<option value="${value}">${value}</option>`
                if (0 > options.indexOf(opt)) options.push(opt)
            })
            for (var o in options) if (-1 < options[o].indexOf(`value="${field_value}"`)) options[o] = options[o].replace(`value`, `selected value`)
            options = options.join(``)
            result = `<select>${options}</select>`
            field
                .off(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`)
                .on(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`, function () {
                    rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table, predefined)
                })
        }
    }

    // tbody=",,dropdown:option-1|option 2|option3,,"
    else if (formula.startsWith(`dropdown:`)) {
        var there_is_other = false
        const options = formula.slice(9).split(`|`).map((option, option_index) => {
            if (`other` === option) there_is_other = true

            if (option.startsWith(`field`)) {
                const field = jQuery(`[name="item_meta[${option.replace(`field`, ``)}]"]`)
                if (field.length > 0) {
                    const field_value = field.val()
                    if (field.is(`[type="text"]`)) {
                        rbundle_html_table_case_dropdown_option_text_field_value(table, tr, td, option_index, field)
                        return `<option value="${field_value}">${field_value}</option>`
                    } else if (field.is(`select`)) {
                        rbundle_html_table_case_dropdown_option_select_field_value(table, tr, td, field, option)
                        return false
                    }
                }
            } else if (option.startsWith(`hidden-field`)) {
                const field = jQuery(`[name="item_meta[${option.replace(`hidden-field`, ``)}]"]`)
                rbundle_html_table_case_dropdown_option_select_field_value(table, tr, td, field, option)
                return false
            } else return `<option value="${option}">${option}</option>`
        }).join(``)
        result = `<select>${options}</select>`
        if (there_is_other) result += `<input type="text" class="form-control" style="height: 34px; display: none">`
    }

    // tbody=",,today-tax-year-by-field238,,"
    else if (formula.startsWith(`today-tax-year-by-field`)) {
        const field_id = formula.replace(`today-tax-year-by-field`, ``)
        const field = jQuery(`[name="item_meta[${field_id}]"]`)
        if (field.length > 0) {
            field
                .off(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`)
                .on(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`, function () {
                    rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table, predefined)
                })
            var end_of_month = field.val()
            if (`Other` === end_of_month) {
                const other = jQuery(`input[name="item_meta[other][${field_id}]"]`)
                other
                    .off(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`)
                    .on(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`, function () {
                        rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table, predefined)
                    })
                end_of_month = other.val()
            }
            const current_year = parseInt((new Date()).getFullYear())
            const year_to_show = new Date(`${end_of_month}/${current_year}`).getTime() <= new Date().getTime() ? current_year + 1 : current_year
            const result_to_show = `${end_of_month}/${year_to_show}`
            if (`` === result && 0 < result_to_show.indexOf(`/`)) result = result_to_show
        }
    }

    // tbody=",,tax-year-end-by-field###,,"
    else if (formula.startsWith(`tax-year-end-by-field`)) {
        result = rbundle_html_table_tax_year_end_by_field(dt, table, tr, td, result, predefined)
        predefined = result// always recalculate
    }
    else if (formula.startsWith(`TY-dash-index-minus-`)) {
        const num = formula.replace(`TY-dash-index-minus-`, ``)
        const index = parseInt(tr) + 1
        const index_minus_num = index - parseInt(num)
        result = `` !== result ? result : `TY - ${index_minus_num}`
    }
    else if (`TY-dash-index` === formula) {
        result = `` !== result ? result : `TY - ` + parseInt(tr + 1)
    }
    else if (formula.startsWith(`fed-tax-dl-column-`)) {
        result = `` !== result ? result : rbundle_html_table_fed_tax(table, tr, td, dt, predefined)
    }
    else if (formula.startsWith(`column-`)) {
        var col_num = formula.replace(`column-`, ``)
        col_num = parseInt(col_num) - 1
        if (col_num !== td) {
            const column = table.find(`tbody`).find(`tr`).eq(tr).find(`td`).eq(col_num)

            if (`` === result) result = column.html()
            column
                .off(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`)
                .on(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`, function () {
                    rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table, predefined)
                })
        }
    }

    else if (`index` === formula) result = tr + 1
    else if (`read-only-index` === formula) result = table.find(`tbody tr`).eq(tr).attr(`read-only-index`)
    else if (formula.startsWith(`table-in-page|`)) rbundle_html_table_table_in_page(table, dt)

    dt.cell({ row: tr, column: td }).data(null === predefined ? result : predefined)
    const target_cell = table.find(`tbody`).find(`tr`).eq(tr).find(`td`).eq(td)
    target_cell.trigger(`change`)
    target_cell.attr(`contenteditable`, contenteditable)
    if (contenteditable) target_cell
        .off(`blur.contenteditable_${table_id}_${tr}_${td}`)
        .on(`blur.contenteditable_${table_id}_${tr}_${td}`, function () {
            target_cell.trigger(`change`)
            rbundle_html_table_content_editable(table, dt, tr)
        })

    // trash click event should be binded after icon created in the cell
    if (`trash` === formula) target_cell.find(`i.fa-solid.fa-trash`)
        .off(`click.trash_${table_id}_${tr}_${td}`)
        .on(`click.trash_${table_id}_${tr}_${td}`, function () {
            rbundle_html_table_delete_row(table, dt, tr)
        })

    // add-row button click event should be binded after button created in the cell
    if (`add-row` === formula) target_cell.find(`input[type="button"][value="+"]`)
        .off(`click.add_row_${table_id}_${tr}_${td}`)
        .on(`click.add_row_${table_id}_${tr}_${td}`, function () {
            rbundle_html_table_add_row(table, dt, tr)
        })

    if (is_datepicker) rbundle_html_table_update_tbody_special_case_datepicker(target_cell, tr, td)
    if (formula.startsWith(`dropdown:`)) rbundle_html_table_update_tbody_special_case_dropdown(dt, target_cell, tr, td)
    if (is_currency) rbundle_html_table_update_tbody_special_case_currency(table_id, target_cell, tr, td)
    if (`zipcode-validation` === formula) rbundle_html_table_update_tbody_special_case_zipcode_validation(target_cell, tr, td)
    if (`%percent` === formula) rbundle_html_table_update_tbody_special_case_percent(table_id, target_cell, tr, td)
    if (formula.startsWith(`if`)) rbundle_html_table_update_tbody_special_case_if_else(target_cell, formula, tr, td, predefined)
}

function rbundle_html_table_content_editable(table, dt, tr) {
    var data = dt.row(tr).data()
    for (var td = 0; td < data.length; td++) {
        data[td] = table.find(`tbody tr:eq(${tr}) td:eq(${td})`).html()
    }
    // dt.row(tr).data(data) this line reset all event on each element rewritten
}

function rbundle_html_table_delete_row(table, dt, tr) {
    var data = dt.rows().data()
    table.find(`tbody tr`).each(function () {
        const idx = jQuery(this).index()
        const atts = this.attributes
        data[idx].attributes = atts
    })
    const thead_length = table.attr(`thead`).split(`,`).length
    const tbody = table.attr(`tbody`).split(`,`)

    data.splice(tr, 1)

    // special case: year index
    const year_index_td = tbody.indexOf(`current-year-dash-index`)
    data = rbundle_html_table_add_row_case_year_index(year_index_td, data)

    rbundle_html_table_update_tbody(thead_length, tbody, dt, table, data);
}

function rbundle_html_table_add_row(table, dt, tr) {
    var data = dt.rows().data()
    table.find(`tbody tr`).each(function () {
        const idx = jQuery(this).index()
        const atts = this.attributes
        data[idx].attributes = atts
    })
    const thead_length = table.attr(`thead`).split(`,`).length
    const tbody = table.attr(`tbody`).split(`,`)

    const row_to_add = []
    for (var th = 0; th < thead_length; th++) {
        var new_cell = ``
        if (
            [`add-row`, `trash`].indexOf(tbody[th]) > -1
            || tbody[th].indexOf(`dropdown:`) > -1
            || `index` === tbody[th]
            || tbody[th].startsWith(`field`)
            || -1 < tbody[th].indexOf(`tax-year-end-by-field`)
            || tbody[th].startsWith(`fed-tax-dl-column-`)
        ) new_cell = null// fallback to tbody formula
        row_to_add.push(new_cell)
    }
    data.splice(tr + 1, 0, row_to_add)

    // special case: index
    const index_td = tbody.indexOf(`index`)
    if (0 < index_td) data = rbundle_html_table_add_row_case_index(index_td, data)

    // special case: year index
    var year_index_td = tbody.indexOf(`current-year-dash-index`)
    if (0 < year_index_td) data = rbundle_html_table_add_row_case_year_index(year_index_td, data)

    var tax_year_end_by_field_td = -1
    for (var tb in tbody) if (tbody[tb].startsWith(`tax-year-end-by-field`)) tax_year_end_by_field_td = tb

    rbundle_html_table_update_tbody(thead_length, tbody, dt, table, data)
}

function rbundle_html_table_add_row_case_index(index_td, data) {
    for (var tr = 0; tr < data.length; tr++) data[tr][index_td] = tr + 1
    return data
}

function rbundle_html_table_add_row_case_year_index(year_index_td, data) {
    for (var tr = 0; tr < data.length; tr++) {
        data[tr][year_index_td] = `Current year - ${tr}`
    }
    return data
}

function rbundle_html_table_update_thead_special_case_csv(table) {
    var thead_data_csv = table.attr(`thead-data-csv`)
    if (!thead_data_csv) return false
    thead_data_csv = thead_data_csv.split(`,`)
    for (var th = 0; th < thead_data_csv.length; th++) {
        table.find(`thead`).find(`tr`).find(`th`).eq(th).attr(`data-csv`, thead_data_csv[th])
    }
}

function rbundle_html_table_update_tbody_special_case_csv(table) {
    var tbody_data_csv = table.attr(`tbody-data-csv`)
    if (!tbody_data_csv) return false
    tbody_data_csv = tbody_data_csv.split(`,`)
    for (var td = 0; td < tbody_data_csv.length; td++) {
        const cell = tbody_data_csv[td]
        if (`` === cell) continue
        const aplhabet = cell.match(/[a-zA-Z]/g).join(``)
        var number = cell.match(/[0-9]/g).join(``)
        for (var tr = 0; tr < table.find(`tbody`).find(`tr`).length; tr++) {
            table.find(`tbody`).find(`tr`).eq(tr).find(`td`).eq(td).attr(`data-csv`, `${aplhabet}${number}`)
            number++
        }
    }
}

function rbundle_html_table_update_thead_special_case_tooltip(table) {
    var thead_data_tooltip = table.attr(`thead-data-tooltip`)
    if (!thead_data_tooltip) return false
    thead_data_tooltip = thead_data_tooltip.split(`,`)
    for (var th = 0; th < thead_data_tooltip.length; th++) {
        if (`` === thead_data_tooltip[th]) continue;
        const thead_target = table.find(`thead`).find(`tr`).find(`th`).eq(th)
        thead_target.append(`<i class="fa fa-icon fa-info-circle" style="font-size: 65%; vertical-align:super; color: blue;">&nbsp;`)
        const i = thead_target.find(`i.fa`)
        i.attr(`title`, thead_data_tooltip[th])
        if (5 == bootstrap.Tooltip.VERSION[0]) i.tooltip({ placement: `bottom` })
        else new bootstrap.Tooltip(i, { placement: `bottom` })
    }
}

function rbundle_html_table_update_tbody_special_case_datepicker(target, tr, td) {
    target.focus(() => {
        const input = target.html(`<input type="hidden">`)
        input.datepicker({ autoclose: true, endDate: `today` })
        input.datepicker().off(`changeDate`).on(`changeDate`, function (e) {
            target.html(e.format(0, `mm/dd/yyyy`))
            target.trigger(`change`)
        })
    })
    target.blur(() => {
        setTimeout(() => {
            rbundle_html_table_reset_error(target)
            var date = target.html().split(`<`)[0]
            if (`` === date) target.addClass(`invalid-cell`)
            else if (`Invalid Date` == new Date(date)) {
                rbundle_html_table_show_error(target, `Invalid Date`)
            } else {
                date = date.replaceAll(`-`, `/`)
                date = date.split(`/`).map((split, index) => {
                    return 2 === index ? `20` + split.slice(-2) : (`0` + split).slice(-2)
                })
                target.html(date.join(`/`))
                target.removeClass(`invalid-cell`)
                const table_id = target.parents(`table`).attr(`id`)
                target.trigger(`blur.contenteditable_${table_id}_${tr}_${td}`)
            }
        }, 500)
    })
}

function rbundle_html_table_update_tbody_special_case_currency(table_id, target_cell, tr, td) {
    target_cell.blur(function () {
        rbundle_html_table_reset_error(target_cell)
        const number = target_cell.html().replace(`$`, ``).replace(`,`, ``)
        if (`` === number) { }
        else if (isNaN(number)) rbundle_html_table_show_error(target_cell, `Numbers only`)
        else {
            target_cell.html(numeral(target_cell.html()).format(`$0,0.00`))
            target_cell.trigger(`blur.contenteditable_${table_id}_${tr}_${td}`)
        }
    })
}

function rbundle_html_table_update_tbody_special_case_dropdown(dt, target_cell, tr, td) {
    const select = target_cell.find(`select`)
    if (`` === select.val()) target_cell.addClass(`invalid-cell`)
    select.change(function () {
        var selected = jQuery(this).val()

        if (`other` === selected) {
            select.siblings(`[type=text]`).show()
            select.siblings(`[type=text]`)
                .blur(function () {
                    jQuery(this).attr(`value`, jQuery(this).val())
                    dt.cell(tr, td).data(target_cell.html())
                    rbundle_html_table_update_tbody_special_case_dropdown(dt, target_cell, tr, td)
                })
        } else select.siblings(`[type=text]`).hide()

        if (`` === selected) target_cell.addClass(`invalid-cell`)
        else target_cell.removeClass(`invalid-cell`)

        target_cell.find(`option`).attr(`selected`, false)
        target_cell.find(`option[value="${selected}"]`).attr(`selected`, true)
        const table_id = target_cell.parents(`table`).attr(`id`)
        target_cell.trigger(`blur.contenteditable_${table_id}_${tr}_${td}`)
    })
}

function rbundle_html_table_update_tbody_special_case_zipcode_validation(target_cell, tr, td) {
    target_cell.blur(() => {
        rbundle_html_table_reset_error(target_cell)
        var zipcode = target_cell.html()
        if (zipcode.length === 9 && 0 > zipcode.indexOf(`-`)) zipcode = zipcode.slice(0, 5) + `-` + zipcode.slice(5)
        if (/(^\d{5}$)|(^\d{5}-\d{4}$)/.test(zipcode)) target_cell.html(zipcode)
        else rbundle_html_table_show_error(target_cell, `Invalid ZIP Code`)
    })
}

function rbundle_html_table_update_tbody_special_case_percent(table_id, target_cell, tr, td) {
    target_cell.blur(() => {
        rbundle_html_table_reset_error(target_cell)
        let number = target_cell.html().replace(`%`, ``).replace(`,`, ``)
        if (`` === number) { }
        else if (isNaN(number)) rbundle_html_table_show_error(target_cell, `Numbers only`)
        else {
            number = parseFloat(number) / 100
            target_cell.html(numeral(number).format(`0.00%`))
            target_cell.trigger(`blur.contenteditable_${table_id}_${tr}_${td}`)
        }
    })
}

function rbundle_html_table_update_tbody_special_case_if_else(target_cell, formula, tr, td, predefined) {
    // tbody=",,if 5 equals field4387 then `Yes` else if field4388 not-equals field4389 then field4387 else if field4389 equals `No` then 18 else field4387,,"
    const table_id = target_cell.parents(`table`).attr(`id`)
    const blocks = formula.split(`else`)
    var matched = false
    for (var block of blocks) {
        if (matched) continue;
        var { left, operator, right, value, error } = rbundle_html_table_if_else_parse_block(block)
        if (error) continue;

        left = rbundle_html_table_if_else_bind_side(left, table_id, tr, td, target_cell, formula, predefined)
        right = rbundle_html_table_if_else_bind_side(right, table_id, tr, td, target_cell, formula, predefined)
        value = rbundle_html_table_if_else_translate_value(value, tr)

        switch (operator) {
            case `equals`:
                if (left == right) {
                    matched = true
                    rbundle_html_table_if_else_apply_value(target_cell, value, tr, td, predefined)
                }
                ; break
            case `not-equals`:
                if (left != right) {
                    matched = true
                    rbundle_html_table_if_else_apply_value(target_cell, value, tr, td, predefined)
                }
                ; break
            case `greater-than`:
                if (left > right) {
                    matched = true
                    rbundle_html_table_if_else_apply_value(target_cell, value, tr, td, predefined)
                }
                ; break
            case `greater-than-equals`:
                if (left >= right) {
                    matched = true
                    rbundle_html_table_if_else_apply_value(target_cell, value, tr, td, predefined)
                }
            case `less-than`:
                if (left < right) {
                    matched = true
                    rbundle_html_table_if_else_apply_value(target_cell, value, tr, td, predefined)
                }
                ; break
            case `less-than-equals`:
                if (left <= right) {
                    matched = true
                    rbundle_html_table_if_else_apply_value(target_cell, value, tr, td, predefined)
                }
                ; break
        }
    }
}

function rbundle_html_table_if_else_parse_block(block) {
    var left = true
    var operator = `equals`
    var right = true
    var value = ``
    var error = false

    try {
        block = block.trim()
        if (0 > block.indexOf(`then`)) { // else
            value = block
        } else {
            for (var op of [`equals`, `not-equals`, `greater-than`, `greater-than-equals`, `less-than`, `less-than-equals`]) {
                if (-1 < block.indexOf(op)) {
                    operator = op
                    left = block.split(`if `)
                    left = left[1]
                    left = left.split(operator)
                    left = left[0]
                    left = left.trim()

                    right = block.split(operator)
                    right = right[1]
                    right = right.split(`then`)
                    right = right[0]
                    right = right.trim()

                    value = block.split(`then`)
                    value = value[1]
                    value = value.trim()
                    value = value.replaceAll('`', ``)
                }
            }
        }
    } catch (e) {
        console.error(block, e)
        error = true
    }

    return { left, operator, right, value, error }
}

function rbundle_html_table_if_else_translate_value(value, tr) {
    if (value.startsWith(`index-minus-`)) value = (tr + 1 - parseInt(value.replace(`index-minus-`, ``))).toString()
    else if (`current-year-dash-index` === value) value = (new Date()).getFullYear() + `-` + (tr + 1)
    else if (`TY-dash-index` === value) value = `TY - ` + (tr + 1)
    else if (value.startsWith(`TY-dash-index-minus-`)) {
        const num = value.replace(`TY-dash-index-minus-`, ``)
        const index = parseInt(tr) + 1
        const index_minus_num = index - parseInt(num)
        value = `TY - ${index_minus_num}`
    } else if (value.startsWith(`field`)) {
        const field_id = value.replace(`field`, ``)
        const field = jQuery(`[name="item_meta[${field_id}]"]`)
        if (field.length > 0) {
            if (field.is(`:radio`)) value = jQuery(`[name="item_meta[${field_id}]"]:checked`).val()
            else value = field.val()
        }
        // field.off(`change`, trigger-fn).on(`change`, re-trigger-fn) skip for now, not needed yet
    }
    return value
}

function rbundle_html_table_if_else_bind_side(side, table_id, tr, td, target_cell, formula, predefined) {
    const if_else_event = `rxbundle_html_table_update_tbody_special_case_if_else_${table_id}_${tr}_${td}`
    if (true === side) return side
    else if (side.startsWith(`field`)) {
        const field = jQuery(`[name="item_meta[${side.replace(`field`, ``)}]"]`)
        if (field.length > 0) {
            side = field.val()
            field
                .off(`change.${if_else_event}`)
                .on(`change.${if_else_event}`, () => {
                    rbundle_html_table_update_tbody_special_case_if_else(target_cell, formula, tr, td, predefined)
                })
        }
    } else if (`index` === side) side = tr + 1
    else if (`read-only-index` === side) side = target_cell.parent().attr(`read-only-index`)
    else if (side.startsWith(`dropdown-column-`)) {
        const col_num = parseInt(side.replace(`dropdown-column-`, ``)) - 1
        const field = target_cell.parent().find(`td`).eq(col_num).find(`select`)
        side = field.val()
        field
            .off(`change.${if_else_event}`)
            .on(`change.${if_else_event}`, () => {
                rbundle_html_table_update_tbody_special_case_if_else(target_cell, formula, tr, td, predefined)
            })
    } else if (side.startsWith(`column-`)) {
        var col_num = side.replace(`column-`, ``)
        col_num = parseInt(col_num) - 1
        if (col_num !== td) {
            const column = jQuery(`table#${table_id}`).find(`tbody`).find(`tr`).eq(tr).find(`td`).eq(col_num)

            side = column.html()
            if (3 === side.split(`/`).length) {
                side = (new Date(side)).getTime()
            }
            column
                .off(`change.${if_else_event}`)
                .on(`change.${if_else_event}`, function () {
                    if (`<input type="hidden">` !== column.html()) rbundle_html_table_update_tbody_special_case_if_else(target_cell, formula, tr, td, predefined)
                })
        }
    }
    return side
}

function rbundle_html_table_if_else_apply_value(target_cell, value, tr, td, predefined) {
    target_cell.attr(`contenteditable`, true)
    if (`date-picker` === value) {
        value = ``
        rbundle_html_table_update_tbody_special_case_datepicker(target_cell, tr, td)
    } else if (`n/a-read-only` === value) {
        value = `N/A`
        target_cell.attr(`contenteditable`, false)
        if (target_cell.datepicker) target_cell.datepicker(`destroy`)
    }

    if (`` === value && `` !== predefined) value = predefined

    target_cell.html(value)
    target_cell.trigger(`change`)
}

function rbundle_html_table_show_error(target, error_message) {
    target.addClass(`invalid-cell`)
    target.attr(`title`, error_message)
    const error_tooltip = new bootstrap.Tooltip(target)

    target.focus(() => {
        target.removeClass(`invalid-cell`)
        error_tooltip.dispose()
    })
}

function rbundle_html_table_reset_error(target) {
    target.removeClass(`invalid-cell`)
    const error_tooltip = new bootstrap.Tooltip(target)
    error_tooltip.dispose()
}

function rbundle_html_table_case_dropdown_option_text_field_value(table, tr, td, option_index, field) {
    const table_id = table.attr(`id`)
    const evt = `change.rbundle_html_table_case_dropdown_option_text_field_value_${table_id}_${tr}_${td}_${option_index}`
    field.off(evt).on(evt, function () {
        const val = field.val()
        const target = table.find(`tbody`).find(`tr`).eq(tr).find(`td`).eq(td).find(`option`).eq(option_index)
        target.prop(`value`, val)
        target.html(val)
    })
}

function rbundle_html_table_case_dropdown_option_select_field_value(table, tr, td, field, formula) {
    const table_id = table.attr(`id`)
    const identifier = `rbundle_html_table_case_dropdown_option_select_field_value_${table_id}_${tr}_${td}`
    const evt = `change.${identifier}`

    field.off(evt).on(evt, function () {
        const field_selected_option = field.find(`option:selected`)
        const field_selected_value = field_selected_option.attr(`value`)
        const field_selected_text = field_selected_option.text()

        const target_dropdown = table.find(`tbody`).find(`tr`).eq(tr).find(`td`).eq(td).find(`select`)
        const option_to_show = formula.startsWith(`hidden-field`) ? field_selected_value : field_selected_text

        target_dropdown.find(`option`).attr(`selected`, false)
        target_dropdown.find(`option[${identifier}]`).remove()
        target_dropdown.prepend(`<option ${identifier}="true" value="${field_selected_value}" selected>${option_to_show}</option>`)
        target_dropdown.trigger(`change`)
    })
}

function rbundle_html_table_fed_tax(table, tr, td, dt, predefined) {
    const table_id = table.attr(`id`)
    const formula = table.attr(`tbody`).split(`,`)[td]

    const parsed_formula = formula.split(`-column-`)
    const date_td = table.find(`tbody`).find(`tr`).eq(tr).find(`td`).eq(parseInt(parsed_formula[1]) - 1)
    const entity = table.find(`tbody`).find(`tr`).eq(tr).find(`td`).eq(parseInt(parsed_formula[2]) - 1).find(`select`)
    const filling_status = table.find(`tbody`).find(`tr`).eq(tr).find(`td`).eq(parseInt(parsed_formula[3]) - 1).find(`select`)

    const date_to_show = new Date(date_td.html())
    const deadline_date = 15
    var months_to_add = 2

    date_to_show.setDate(deadline_date)
    switch (entity.val()) {
        case `Pass-Through`: months_to_add = 3; break
        case `Taxable`: months_to_add = 4; break
        case `Exempt`: months_to_add = 5; break
    }
    if (`Granted extension and filed` === filling_status.val()) months_to_add += 6

    const translated_month = date_to_show.getMonth()
    date_to_show.setMonth(translated_month + months_to_add)
    if (0 === date_to_show.getDay()) date_to_show.setDate(date_to_show.getDate() + 1)// sunday
    if (6 === date_to_show.getDay()) date_to_show.setDate(date_to_show.getDate() + 2)// saturday

    date_td
        .off(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`)
        .on(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`, function () {
            rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table, null)
        })
    date_td
        .off(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`)
        .on(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`, function () {
            rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table, null)
        })
    entity
        .off(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`)
        .on(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`, function () {
            rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table, null)
        })
    entity
        .off(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`)
        .on(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`, function () {
            rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table, null)
        })
    filling_status
        .off(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`)
        .on(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`, function () {
            rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table, null)
        })
    return date_to_show.toLocaleDateString()
}

function rbundle_html_table_tax_year_end_by_field(dt, table, tr, td, result, predefined) {
    const formula = table.attr(`tbody`).split(`,`)[td]
    const field_id = formula.replace(`tax-year-end-by-field`, ``)
    const field = jQuery(`[name="item_meta[${field_id}]"]`)
    if (field.length > 0) {
        const table_id = table.attr(`id`)
        field
            .off(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`)
            .on(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`, function () {
                rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table, predefined)
            })
        var end_of_month = field.val()
        if (`Other` === end_of_month) {
            const other = jQuery(`input[name="item_meta[other][${field_id}]"]`)
            other
                .off(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`)
                .on(`change.rbundle_html_table_update_tbody_cell_${table_id}_${tr}_${td}`, function () {
                    rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table, predefined)
                })
            end_of_month = other.val()
        }
        const current_year = parseInt((new Date()).getFullYear())
        var year_to_show = new Date(`${end_of_month}/${current_year}`).getTime() <= new Date().getTime() ? current_year + 1 : current_year
        year_to_show -= parseInt(tr)
        const result_to_show = `${end_of_month}/${year_to_show}`
        if (`` === result && 0 < result_to_show.indexOf(`/`)) result = result_to_show
    }
    return result
}

// row-count="fed-tr-amend-open-column2-field4387-column10-column11:Total Offset"
function rbundle_html_table_fed_tr_amend(table, dt, trigger_field, trigger_tr_index) {
    const row_count_formula = table.attr(`row-count`)
    if (!row_count_formula.startsWith(`fed-tr-amend-open-column`)) return;

    const [unused, year_end_td, nol_td, offset_td] = row_count_formula.replace(`fed-tr-amend-open`, ``).split(`-column`).map(part => parseInt(part.split(`-`)[0]) - 1)
    const formed_year_field_id = row_count_formula.split(`field`)[1].split(`-`)[0]
    const expected_offset_value = row_count_formula.split(`:`)[1]
    const table_rows = table.find(`tbody`).find(`tr`)

    if (-1 < [`year_end`, `rbundle_html_table_update_tbody`].indexOf(trigger_field)) trigger_tr_index = table_rows.length - 1// on year change, check last row
    const triggering_tr_tds = table_rows.eq(trigger_tr_index).find(`td`)

    const year_end_element = triggering_tr_tds.eq(year_end_td)
    const nol_element = triggering_tr_tds.eq(nol_td)
    const offset_element = triggering_tr_tds.eq(offset_td).find(`select`)
    const formed_year_field_element = jQuery(`[name="item_meta[${formed_year_field_id}]"]`)

    const year_end_value = parseInt(year_end_element.text().split(`/`)[2])
    const nol_value = parseInt(nol_element.text().replace(`$`, ``).replace(`,`, ``))
    const offset_value = offset_element.val()
    const formed_year_field_value = parseInt(formed_year_field_element.val())

    const is_triggered_by_last_tr = trigger_tr_index === table_rows.length - 1
    const is_end_year_match = year_end_value > formed_year_field_value
    const is_nol_match = 0 < nol_value
    const is_offset_match = expected_offset_value == offset_value
    const tr = table_rows.last().index()
    switch (trigger_field) {
        case `year_end`:
            for (tr_to_remove = table.find(`tbody`).find(`tr`).length; tr_to_remove >= 0; tr_to_remove--) {
                const row_to_remove = table.find(`tbody`).find(`tr`).eq(tr_to_remove)
                const row_year = parseInt(row_to_remove.find(`td`).eq(year_end_td).text().split(`/`)[2])
                if (row_year < formed_year_field_value) rbundle_html_table_delete_row(table, dt, tr_to_remove)
            }
        case `rbundle_html_table_update_tbody`:
            if (is_end_year_match && (3 > tr || is_nol_match || is_offset_match)) rbundle_html_table_add_row(table, dt, tr)
                ; break
        case `nol`:
            if (is_end_year_match && is_nol_match && is_triggered_by_last_tr) rbundle_html_table_add_row(table, dt, tr)
            if (tr > 3 && !is_nol_match && !is_triggered_by_last_tr) rbundle_html_table_delete_row(table, dt, tr)
                ; break
        case `offset`:
            if (is_end_year_match && is_offset_match && is_triggered_by_last_tr) rbundle_html_table_add_row(table, dt, tr)
            if (tr > 3 && !is_offset_match && !is_triggered_by_last_tr) rbundle_html_table_delete_row(table, dt, tr)
            table.find(`tbody`).find(`tr`).eq(trigger_tr_index).find(`td`).eq(offset_td).find(`select`).val(offset_value)// fix offset dropdown not updating
                ; break
    }

    const rbundle_html_table_fed_tr_amend_event = `rbundle_html_table_fed_tr_amend_${table.attr(`id`)}`
    formed_year_field_element
        .off(`keyup.${rbundle_html_table_fed_tr_amend_event}`)
        .on(`keyup.${rbundle_html_table_fed_tr_amend_event}`, () => {
            if (1900 < parseInt(formed_year_field_element.val())) rbundle_html_table_fed_tr_amend(table, dt, `year_end`, false)
        })

    const total_rows_after_run = table.find(`tbody`).find(`tr`).length
    const rows_to_bind = [total_rows_after_run - 1, total_rows_after_run - 2]
    table.find(`tbody`).find(`tr`).each(function () {
        const tr_to_bind = jQuery(this)
        const tr_to_bind_index = tr_to_bind.index()

        const nol_to_bind = tr_to_bind.find(`td`).eq(nol_td)
        nol_to_bind.off(`blur.${rbundle_html_table_fed_tr_amend_event}`)

        const offset_to_bind = tr_to_bind.find(`td`).eq(offset_td).find(`select`)
        offset_to_bind.off(`change.${rbundle_html_table_fed_tr_amend_event}`)

        if (-1 < rows_to_bind.indexOf(tr_to_bind_index)) {
            nol_to_bind.on(`blur.${rbundle_html_table_fed_tr_amend_event}`, () => {
                rbundle_html_table_fed_tr_amend(table, dt, `nol`, tr_to_bind_index)
            })
            offset_to_bind.on(`change.${rbundle_html_table_fed_tr_amend_event}`, () => {
                rbundle_html_table_fed_tr_amend(table, dt, `offset`, tr_to_bind_index)
            })
        }
    })
}

function rbundle_html_table_table_in_page(table, dt) {
    const table_id = table.attr(`id`)
    if (-1 < table.attr(`thead`).indexOf(`table-in-page|`)) {
        var theads = table.attr(`thead`).split(`,`)
        for (var th = 0; th < theads.length; th++) {
            var thead = theads[th]
            if (thead.startsWith(`table-in-page|`)) {
                var formula = thead.split(`|`)
                var taget_table_id = formula[1]
                var target_attr = formula[2]
                var target_table = jQuery(`table[id="${taget_table_id}"]`)
                if (0 < target_table.length) {
                    // https://github.com/susantohenri/rbundle-html-table/commit/5a614157282d5794920e7e6f5b9d706038d82610
                }
            }
        }
    }

    var row_count = table.attr(`row-count`)
    if (row_count.startsWith(`table-in-page|`)) {
        var formula = row_count.split(`|`)
        var taget_table_id = formula[1]
        var target_attr = formula[2]
        var target_table = jQuery(`table[id="${taget_table_id}"]`)
        if (0 < target_table.length) {
            if (`row-count` === target_attr) {
                const target_row_count = target_table.find(`tbody tr`).length
                rbundle_html_table_table_in_page_adjust_row_count(table, dt, target_row_count)
                target_table.on(`change.rbundle_html_table_table_in_page-${table_id}`, () => {
                    const target_row_count = target_table.find(`tbody tr`).length
                    rbundle_html_table_table_in_page_adjust_row_count(table, dt, target_row_count)
                })
            }
            //https://github.com/susantohenri/rbundle-html-table/commit/5a614157282d5794920e7e6f5b9d706038d82610
        }
    }

    if (-1 < table.attr(`tbody`).indexOf(`table-in-page|`)) {
        var tbodies = table.attr(`tbody`).split(`,`)
        for (var th = 0; th < tbodies.length; th++) {
            var tbody = tbodies[th]
            if (tbody.startsWith(`table-in-page|`)) {
                var formula = tbody.split(`|`)
                var taget_table_id = formula[1]
                var target_attr = formula[2]
                var target_table = jQuery(`table[id="${taget_table_id}"]`)
                if (0 < target_table.length) {
                    //https://github.com/susantohenri/rbundle-html-table/commit/5a614157282d5794920e7e6f5b9d706038d82610
                }
            }
        }
    }
}

function rbundle_html_table_table_in_page_adjust_row_count(table, dt, next_row_count) {
    const current_row_count = table.find(`tbody tr`).length
    if (current_row_count === next_row_count) {

    } else if (current_row_count <= next_row_count) {
        for (let row = current_row_count; row < next_row_count; row++) {
            rbundle_html_table_add_row(table, dt, row)
        }
    } else if (current_row_count > next_row_count) {
        for (let row = current_row_count; row >= next_row_count; row--) {
            rbundle_html_table_delete_row(table, dt, row)
        }
    }
}