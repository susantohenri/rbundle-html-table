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
        title: thead[head_idx], targets: head_idx
    })

    const dt = new DataTable(`#${id}`, dt_options)
    rbundle_html_table_draw_body(table, dt)
})

function rbundle_html_table_draw_body(table, dt) {
    const row_count = table.attr(`row-count`)
    const th_count = table.attr(`thead`).split(`,`).length
    const tbody = undefined !== table.attr(`tbody`) ? table.attr(`tbody`).split(`,`) : []
    var body = []

    for (var tr = 0; tr < row_count; tr++) {
        body[tr] = [];
        for (var td = 0; td < th_count; td++) {
            body[tr][td] = rbundle_html_table_translate_formula(tbody[td], table, dt);
        }
    }

    dt.clear()
    dt.rows.add(body).draw()
    table.find(`tbody td`).attr(`contenteditable`, true)
}

function rbundle_html_table_translate_formula(formula, table, dt) {
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
        const field = jQuery(`[name="item_meta[${formula.replace('field', '')}]"]`)
        if (field.length > 0) {
            result = field.val()
            field.change(function () {
                rbundle_html_table_draw_body(table, dt)
            })
        }
    }

    return result
}