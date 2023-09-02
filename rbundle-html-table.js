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
    const row_count = table.attr(`row-count`)
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

    dt.clear()
    dt.rows.add(body).draw()
    table.find(`tbody td`).attr(`contenteditable`, true)
    rbundle_html_table_trash(table, dt)
    rbundle_html_table_special_case_current_year_dash_index(tbody, table, dt)
}

function rbundle_html_table_translate_formula(formula, field_change_callback) {
    var result = ``

    // if not set
    if (undefined === formula) return result
    formula = formula.trim()

    // string and number marked with (`), i.e: `N/A`, `153`
    if ('`' === formula.charAt(0) && '`' === formula.slice(-1)) {
        result = formula.substring(1, formula.length - 1)
    }

    // field starts with 'field', i.e: field1243, field1122
    else if (formula.startsWith(`field`)) {
        const field = jQuery(`[name="item_meta[${formula.replace(`field`, ``)}]"]`)
        if (field.length > 0) {
            result = field.val()
            field.change(field_change_callback)
        }
    }

    // show trash icon for deleting current row, keyword: 'delete-button'
    else if (`delete-button` === formula) result = `<i class="fa-solid fa-trash"></i>`

    return result
}

function rbundle_html_table_special_case_current_year_dash_index(tbody, table, dt) {
    const td_index = tbody.indexOf(`current-year-dash-index`)
    if (0 > td_index) return false

    for (var tr_index = 0; tr_index < table.find(`tbody tr`).length; tr_index++) {
        dt.cell({ row: tr_index, column: td_index }).data(`Current year - ${tr_index}`)
        table.find(`tr`).eq(tr_index + 1).find(`td`).eq(td_index).removeAttr(`contenteditable`)
    }
}

function rbundle_html_table_trash(table, dt) {
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