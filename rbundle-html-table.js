jQuery(`table.rbundle-html-table`).each(function (index) {
    const table = jQuery(this)
    const id = table.attr(`id`)
    const thead = table.attr(`thead`).split(`,`)

    const dt_options = {
        ordering: false
        , paging: false
        , searching: false
        , info: false
    }
    dt_options.columnDefs = []
    for (var head_idx = 0; head_idx < thead.length; head_idx++) dt_options.columnDefs.push({
        title: ``, targets: head_idx
    })

    const dt = new DataTable(`#${id}`, dt_options)
    rbundle_html_table_draw_header(table, dt)
    rbundle_html_table_draw_body(table, dt)
})

function rbundle_html_table_draw_header(table, dt) {
    const thead = table.attr(`thead`).split(`,`)
    for (var head_idx = 0; head_idx < thead.length; head_idx++) {
        jQuery(dt.column(head_idx).header()).text(rbundle_html_table_translate_formula(thead[head_idx], function () {
            rbundle_html_table_draw_header(table, dt)
        }))
    }
}

function rbundle_html_table_draw_body(table, dt) {
    var row_count = table.attr(`row-count`)
    row_count = rbundle_html_table_special_case_custom_row_count(row_count, function () {
        rbundle_html_table_draw_body(table, dt)
    })
    const th_count = table.attr(`thead`).split(`,`).length
    const tbody = undefined !== table.attr(`tbody`) ? table.attr(`tbody`).split(`,`) : []
    var body = []

    for (var tr = 0; tr < row_count; tr++) {
        body[tr] = [];
        for (var td = 0; td < th_count; td++) {
            body[tr][td] = rbundle_html_table_translate_formula(tbody[td], function () {
                rbundle_html_table_draw_body(table, dt)
            })
        }
    }

    if (1 > body.length) return false
    dt.clear()
    dt.rows.add(body).draw()
    table.find(`tbody td`).attr(`contenteditable`, true)
    rbundle_html_table_special_case_trash(table, dt)
    rbundle_html_table_special_case_custom_tbody(tbody, table, dt, function () {
        rbundle_html_table_draw_body(table, dt)
    })
}

function rbundle_html_table_translate_formula(formula, redraw) {
    var result = ``

    // if no attribute tbody
    if (undefined === formula) return result
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
            field.change(redraw)
        }
    }

    // tbody=",,trash,,"
    else if (`trash` === formula) result = `<i class="fa-solid fa-trash"></i>`

    return result
}

function rbundle_html_table_special_case_custom_tbody(tbody, table, dt, redraw) {
    // tbody=",,current-year-dash-index,," => Current year - 2
    var td_index = tbody.indexOf(`current-year-dash-index`)
    if (-1 < td_index) {
        for (var tr_index = 0; tr_index < table.find(`tbody tr`).length; tr_index++) {
            dt.cell({ row: tr_index, column: td_index }).data(`Current year - ${tr_index}`)
            table.find(`tr`).eq(tr_index + 1).find(`td`).eq(td_index).removeAttr(`contenteditable`)
        }
    }

    // tbody=",,tax-years-field238,," => 12/31/2022
    const exists = tbody.filter(function (cell) {
        return cell.startsWith(`tax-years-field`)
    })
    if (1 === exists.length) {
        td_index = tbody.indexOf(exists[0])
        const field_id = exists[0].replace(`tax-years-field`, ``)
        const field = jQuery(`[name="item_meta[${field_id}]"]`)
        if (field.length > 0) {
            field.change(redraw)
            const value = field.val()
            const current_year = parseInt((new Date()).getFullYear())
            for (var tr_index = 0; tr_index < table.find(`tbody tr`).length; tr_index++) {
                const text = `${value}/${current_year - tr_index}`
                dt.cell({ row: tr_index, column: td_index }).data(text)
            }
        }
    }

}

function rbundle_html_table_special_case_trash(table, dt) {
    table.find(`tbody tr td i.fa-solid.fa-trash`).each(function () {
        const trash = jQuery(this)
        const td = trash.parent()
        const tr = td.parent()
        td.removeAttr(`contenteditable`)
        jQuery(this).click(function () {
            dt.row(tr).remove().draw(false)
        })
    })
}

function rbundle_html_table_special_case_custom_row_count(row_count, redraw_body) {

    // row-count="current-year-minus-field840" => 2023 (current year) - 2022 (input value) + 1 (include current year) = 2 row
    if (row_count.startsWith(`current-year-minus-`)) {
        const field_id = row_count.replace(`current-year-minus-`, ``).replace(`field`, ``)
        const field = jQuery(`[name="item_meta[${field_id}]"]`)
        if (field.length > 0) {
            field.change(redraw_body)
            return parseInt((new Date()).getFullYear()) - parseInt(field.val()) + 1
        } else return 0
    } else return row_count
}