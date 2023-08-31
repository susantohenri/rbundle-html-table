jQuery(`table.rbundle-html-table`).each(function (index) {
    const table = jQuery(this)
    const id = table.attr(`id`)
    const headers = table.attr(`header`).split(`,`)

    const dt_options = {
        ordering: false
        , paging: false
        , searching: false
        , info: false
    }
    dt_options.columnDefs = []
    for (var head_idx=0; head_idx < headers.length; head_idx++) dt_options.columnDefs.push({
        title: headers[head_idx], targets: head_idx
    })

    new DataTable(`#${id}`, dt_options);
})