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

    const dt = new DataTable(`#${table.attr(`id`)}`, dt_options)
    if (0 < thead_length) {
        rbundle_html_table_update_thead(thead, dt)
        if (undefined !== table.attr(`tbody`)) {
            rbundle_html_table_update_tbody(thead_length, table.attr(`tbody`).split(`,`), dt, table)
        }
    }
}

function rbundle_html_table_update_thead(thead, dt) {
    for (var th = 0; th < thead.length; th++) {
        rbundle_html_table_update_thead_cell(th, thead[th], dt)
    }
}

function rbundle_html_table_update_thead_cell(th, formula, dt) {
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
                .off(`change.rbundle_html_table_update_thead_cell`)
                .on(`change.rbundle_html_table_update_thead_cell`, function () {
                    rbundle_html_table_update_thead_cell(th, formula, dt)
                })
        }
    }

    jQuery(dt.column(th).header()).text(result)
}

function rbundle_html_table_update_tbody(thead_length, tbody, dt, table) {
    var row_count = table.attr(`row-count`)
    row_count = rbundle_html_table_custom_row_count(row_count, function () {
        rbundle_html_table_update_tbody(thead_length, tbody, dt, table)
    })
    if (1 > row_count) return false

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
            if (undefined !== tbody[td]) rbundle_html_table_update_tbody_cell(tr, td, tbody[td], dt, table)
        }
    }
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
    } else return row_count
}

function rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table) {
    var result = ``
    var contenteditable = true
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
                .off(`change.rbundle_html_table_update_tbody_cell_${tr}_${td}`)
                .on(`change.rbundle_html_table_update_tbody_cell_${tr}_${td}`, function () {
                    rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table)
                })
        }
    }

    // tbody=",,trash,,"
    else if (`trash` === formula) {
        result = `<i class="fa-solid fa-trash"></i>`
        contenteditable = false

        // onclick attached to the td because the trash icon willl just be created in the end of this fn
        table.find(`tbody tr:eq(${tr}) td:eq(${td})`)
            .off(`click.trash_${tr}_${td}`)
            .on(`click.trash_${tr}_${td}`, function () {
                dt.row(tr).remove().draw(false)
            })
    }

    // tbody=",,current-year-dash-index,," => Current year - 2
    else if (`current-year-dash-index` === formula) {
        result = `Current year - ${tr}`
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
                    rbundle_html_table_update_tbody_cell(tr, td, formula, dt, table)
                })
            const value = field.val()
            const current_year = parseInt((new Date()).getFullYear())
            result = `${value}/${current_year - tr}`
        }
    }

    dt.cell({ row: tr, column: td }).data(result)
    table.find(`tr`).eq(tr).find(`td`).eq(td).attr(`contenteditable`, contenteditable)
}