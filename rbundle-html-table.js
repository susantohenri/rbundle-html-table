jQuery(`table.rbundle-html-table`).each(function () {
    rbundle_html_table_draw_table(jQuery(this))
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
    if (table.attr('restrict-delete-default-row')) table.find(`tbody tr`).addClass(`default-row`)
}

function rbundle_html_table_update_thead(thead, dt, table) {
    for (var th = 0; th < thead.length; th++) {
        rbundle_html_table_update_thead_cell(th, thead[th], dt, table)
    }
    rbundle_html_table_update_thead_special_case_csv(table)
}

function rbundle_html_table_update_thead_cell(th, formula, dt, table) {
    var result = ``
    const is_datepicker = formula.indexOf(`date-picker`) > -1
    if (is_datepicker) formula = formula.replace(`date-picker`, ``).trim()

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
                .off(`change.rbundle_html_table_update_thead_cell`)
                .on(`change.rbundle_html_table_update_thead_cell`, function () {
                    rbundle_html_table_update_thead_cell(th, formula, dt, table)
                })
        }
    }

    jQuery(dt.column(th).header()).text(result)
    if (is_datepicker) rbundle_html_table_update_thead_special_case_datepicker(table, th)
}

function rbundle_html_table_update_tbody(thead_length, tbody, dt, table, data) {
    var row_count = 0
    if (data) row_count = data.length
    else {
        row_count = table.attr(`row-count`)
        row_count = rbundle_html_table_custom_row_count(row_count, function () {
            rbundle_html_table_update_tbody(thead_length, tbody, dt, table, data)
        })
    }

    var body = []
    for (var tr = 0; tr < row_count; tr++) {
        body[tr] = []
        for (var td = 0; td < thead_length; td++) {
            body[tr][td] = ``
        }
    }
    dt.clear()
    dt.rows.add(body).draw()

    for (var tr = 0; tr < row_count; tr++) {
        for (var td = 0; td < thead_length; td++) {
            const predefined = data ? data[tr][td] : null
            if (undefined !== tbody[td]) rbundle_html_table_update_tbody_cell(tr, td, tbody[td], dt, table, predefined)
        }
    }

    rbundle_html_table_update_tbody_special_case_csv(table)
}

function rbundle_html_table_custom_row_count(row_count, redraw_body) {
    // row-count="current-year-minus-field840" => 2023 (current year) - 2022 (input value) + 1 (include current year) = 2 row
    if (row_count.startsWith(`current-year-minus-`)) {
        var result = 0
        const field_id = row_count.replace(`current-year-minus-`, ``).replace(`field`, ``)
        const field = jQuery(`[name="item_meta[${field_id}]"]`)
        if (field.length > 0) {
            result = `` === field.val() ? 0 : parseInt((new Date()).getFullYear()) - parseInt(field.val()) + 1
            field
                .off(`change.rbundle_html_table_custom_row_count`)
                .on(`change.rbundle_html_table_custom_row_count`, redraw_body)
        }
        return result
    }
    /* row-count="field4163" */
    /* row-count="field4163+field4165-field3345" */
    if (row_count.startsWith(`field`)) {
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
                    .off(`change.rbundle_html_table_custom_row_count`)
                    .on(`change.rbundle_html_table_custom_row_count`, redraw_body)
            }

            if ([`+`, `-`, `*`].indexOf(last_char) > -1) operator = last_char
        })
        return result
    } else return row_count
}

function rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table, predefined) {
    var result = ``
    var contenteditable = true
    const is_datepicker = formula.indexOf(`date-picker`) > -1
    if (is_datepicker) formula = formula.replace(`date-picker`, ``)
    formula = formula.trim()

    // tbody=",,`N/A`, `153`,,"
    if ('`' === formula.charAt(0) && '`' === formula.slice(-1)) {
        if (`` === result) result = formula.substring(1, formula.length - 1)
    }

    // tbody=",,field1243,,"
    else if (formula.startsWith(`field`)) {
        const field = jQuery(`[name="item_meta[${formula.replace(`field`, ``)}]"]`)
        if (field.length > 0) {
            if (`` === result) result = field.val()
            field
                .off(`change.rbundle_html_table_update_tbody_cell_${tr}_${td}`)
                .on(`change.rbundle_html_table_update_tbody_cell_${tr}_${td}`, function () {
                    rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table, predefined)
                })
        }
    }

    // tbody=",,trash,,"
    else if (`trash` === formula) {
        if (`` === result) result = `<i class="fa-solid fa-trash"></i>`
        contenteditable = false
    }

    // tbody=",,add-row,,"
    else if (`add-row` === formula) {
        if (`` === result) result = `<input type="button" value="+">`
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
                .off(`change.rbundle_html_table_update_tbody_cell_${tr}_${td}`)
                .on(`change.rbundle_html_table_update_tbody_cell_${tr}_${td}`, function () {
                    rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table, predefined)
                })
            const value = field.val()
            const current_year = parseInt((new Date()).getFullYear())
            if (`` === result) result = `${value}/${current_year - tr}`
        }
    }

    // tbody=",,dropdown:option-1|option 2|option3,,"
    else if (formula.startsWith(`dropdown:`)) {
        const options = formula.slice(9).split(`|`).map(option => {
            return `<option value="${option}">${option}</option>`
        }).join(``)
        result = `<select>${options}</select>`
    }

    dt.cell({ row: tr, column: td }).data(null === predefined ? result : predefined)
    const target_cell = table.find(`tbody`).find(`tr`).eq(tr).find(`td`).eq(td)
    target_cell.attr(`contenteditable`, contenteditable)
    if (contenteditable) target_cell
        .off(`blur.contenteditable_${tr}_${td}`)
        .on(`blur.contenteditable_${tr}_${td}`, function () {
            rbundle_html_table_content_editable(table, dt, tr)
        })

    // trash click event should be binded after icon created in the cell
    if (`trash` === formula) target_cell.find(`i.fa-solid.fa-trash`)
        .off(`click.trash_${tr}_${td}`)
        .on(`click.trash_${tr}_${td}`, function () {
            rbundle_html_table_delete_row(table, dt, tr)
        })

    // add-row button click event should be binded after button created in the cell
    if (`add-row` === formula) target_cell.find(`input[type="button"][value="+"]`)
        .off(`click.add_row_${tr}_${td}`)
        .on(`click.add_row_${tr}_${td}`, function () {
            rbundle_html_table_add_row(table, dt, tr)
        })

    if (is_datepicker) rbundle_html_table_update_tbody_special_case_datepicker(table, tr, td)
    if (formula.startsWith(`dropdown:`)) target_cell.find(`select`).change(function () {
        target_cell.find(`option[value="${jQuery(this).val()}"]`).attr(`selected`, true)
        target_cell.trigger(`blur.contenteditable_${tr}_${td}`)
    })
}

function rbundle_html_table_content_editable(table, dt, tr) {
    var data = dt.row(tr).data()
    for (var td = 0; td < data.length; td++) {
        data[td] = table.find(`tbody tr:eq(${tr}) td:eq(${td})`).html()
    }
    // dt.row(tr).data(data)
}

function rbundle_html_table_delete_row(table, dt, tr) {
    var data = dt.rows().data()
    const thead_length = table.attr(`thead`).split(`,`).length
    const tbody = table.attr(`tbody`).split(`,`)
    var default_row_indexes = table.find(`tbody tr`).map(function () {
        return jQuery(this).is(`.default-row`)
    })

    data.splice(tr, 1)
    default_row_indexes.splice(tr, 1)

    // special case: year index
    const year_index_td = tbody.indexOf(`current-year-dash-index`)
    data = rbundle_html_table_add_row_case_year_index(year_index_td, data)

    rbundle_html_table_update_tbody(thead_length, tbody, dt, table, data);
    default_row_indexes.map((index, value, array) => {
        if (true === value) table.find(`tbody tr`).eq(index).addClass(`default-row`)
    })
}

function rbundle_html_table_add_row(table, dt, tr) {
    var data = dt.rows().data()
    const thead_length = table.attr(`thead`).split(`,`).length
    const tbody = table.attr(`tbody`).split(`,`)
    var default_row_indexes = table.find(`tbody tr`).map(function () {
        return jQuery(this).is(`.default-row`)
    })

    const row_to_add = []
    for (var th = 0; th < thead_length; th++) {
        var new_cell = ``
        if ([`add-row`, `trash`].indexOf(tbody[th]) > -1) new_cell = null// fallback to tbody formula
        row_to_add.push(new_cell)
    }
    data.splice(tr + 1, 0, row_to_add)
    default_row_indexes.splice(tr + 1, 0, false)

    // special case: year index
    var year_index_td = tbody.indexOf(`current-year-dash-index`)
    if (0 < year_index_td) data = rbundle_html_table_add_row_case_year_index(year_index_td, data)

    rbundle_html_table_update_tbody(thead_length, tbody, dt, table, data);
    default_row_indexes.map((index, value, array) => {
        if (true === value) table.find(`tbody tr`).eq(index).addClass(`default-row`)
    })
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

function rbundle_html_table_update_thead_special_case_datepicker(table, col) {
    const target = table.find(`thead`).find(`tr`).find(`th`).eq(col)
    target.click(() => {
        target.off(`click`).html(`<input type="text" style="display: none">`)
            .datepicker({ autoclose: true })
            .datepicker(`show`)
            .change(() => { target.html(target.find(`input`).val()) })
    })
}

function rbundle_html_table_update_tbody_special_case_datepicker(table, tr, td) {
    const target = table.find(`tbody`).find(`tr`).eq(tr).find(`td`).eq(td)
    target.focus(() => {
        const input = target.html(`<input type="text" style="display: none">`)
        input.datepicker(`destroy`)
        input.datepicker({ autoclose: true })
        input.datepicker(`show`)
        input.datepicker().on(`change`, function (e) {
            target.html(e.target.value)
            target.trigger(`blur.contenteditable_${tr}_${td}`)
        })
    })
}