<?php

/**
 * RBundle HTML Table
 *
 * @package     RBundleHTMLTable
 * @author      Henri Susanto
 * @copyright   2022 Henri Susanto
 * @license     GPL-2.0-or-later
 *
 * @wordpress-plugin
 * Plugin Name: RBundle HTML Table
 * Plugin URI:  https://github.com/susantohenri/rbundle-html-table
 * Description: RBundle Wordpress Plugin for Generating HTML Tables
 * Version:     1.0.0
 * Author:      Henri Susanto
 * Author URI:  https://github.com/susantohenri/
 * Text Domain: RBundleHTMLTable
 * License:     GPL v2 or later
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 */

define('RBUNDLE_HTML_TABLE_ATTRIBUTES', [
    /* mandatory fields */
    'thead' => ',,`Tax Years`,`Subject to BBA` date-picker, currency-format,',
    /*
        not mandatory fields:
        'id' => 'set_unique_id_here',
        'row-count' => 3,
        'row-count' => current-year-minus-field840,
        'row-count' => field4388+field4388-field4389,
        'tbody' => ',,`Tax Years`,field1480 date-picker,dropdown:option-1|option 2|option3, currency-format,',
        'thead-data-csv' => ',,H38,I38,J38,K38',
        'tbody-data-csv' => ',,G39,H39,I39,J39',
        'restrict-delete-default-row' => 'true',
     */
]);

add_shortcode('rbundle-html-table', function ($a_attr) {
    // return json_encode($a_attr);
    foreach (RBUNDLE_HTML_TABLE_ATTRIBUTES as $required_attr => $sample) {
        if (!isset($a_attr[$required_attr])) return "please set table {$required_attr} by setting shortcode attribute " . $required_attr . '="' . $sample . '"';
    }
    $a_attr['row-count'] = isset($a_attr['row-count']) ? $a_attr['row-count'] : 0;

    // validate row-count operator on multiple fields
    if ('field' === substr($a_attr['row-count'], 0, 5)) {
        $split_fields = explode('field', $a_attr['row-count']);
        foreach ($split_fields as $index => $field_id) {
            if (!in_array($index, [0, count($split_fields) - 1]) && !in_array(substr($field_id, -1), ['+', '-', '*'])) {
                return 'Invalid row-count ' . $a_attr['row-count'];
            }
        }
    }

    $a_attr['class'] = 'table rbundle-html-table';

    wp_register_script('bootstrap', 'https://cdn.usebootstrap.com/bootstrap/3.3.7/js/bootstrap.min.js');
    wp_enqueue_script('bootstrap');

    wp_register_style('datatables', 'https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css');
    wp_enqueue_style('datatables');

    wp_register_script('datatables', 'https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js');
    wp_enqueue_script('datatables');

    wp_register_style('rbundle-html-table', plugin_dir_url(__FILE__) . 'rbundle-html-table.css?token=' . time());
    wp_enqueue_style('rbundle-html-table');

    wp_register_script('rbundle-html-table', plugin_dir_url(__FILE__) . 'rbundle-html-table.js?token=' . time(), ['jquery']);
    wp_enqueue_script('rbundle-html-table');

    $load_datepicker = false;
    $load_numeral = false;
    if (isset($a_attr['tbody'])) {
        $tbody_datepicker = array_filter(explode(',', $a_attr['tbody']), function ($td) {
            return strpos($td, 'date-picker') > -1;
        });
        $load_datepicker = $load_datepicker || count($tbody_datepicker) > 0;

        $tbody_numeral = array_filter(explode(',', $a_attr['tbody']), function ($td) {
            return strpos($td, 'currency-format') > -1;
        });
        $load_numeral = $load_numeral || count($tbody_numeral) > 0;
    }
    if ($load_datepicker) {
        wp_register_style('bootstrap-date-picker', 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datepicker/1.6.4/css/bootstrap-datepicker.css');
        wp_enqueue_style('bootstrap-date-picker');

        wp_register_script('bootstrap-date-picker', 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datepicker/1.6.4/js/bootstrap-datepicker.js');
        wp_enqueue_script('bootstrap-date-picker');
    }
    if ($load_numeral) {
        wp_register_script('numeral', 'https://cdnjs.cloudflare.com/ajax/libs/numeral.js/2.0.6/numeral.min.js');
        wp_enqueue_script('numeral');
    }

    // table reference different form: begin
    if (isset($a_attr['thead'])) {
        if (-1 < strpos($a_attr['thead'], 'table|')) {
            $a_theads = explode(',', $a_attr['thead']);
            for ($th = 0; $th < count($a_theads); $th++) {
                if (str_starts_with($a_theads[$th], 'table|')) {
                    $formula = explode('|', $a_theads[$th]);

                    $s_target_table_id = $formula[1];
                    global $wpdb;
                    $s_target_table = $wpdb->get_var($wpdb->prepare("SELECT `description` FROM {$wpdb->prefix}frm_fields WHERE `description` LIKE %s", '%id="' . $s_target_table_id . '"%'));
                    if ($s_target_table) {
                        $s_target_table_attr_name = $formula[2];
                        if (-1 < strpos($s_target_table, "{$s_target_table_attr_name}=")) {
                            $a_target_parse = explode("{$s_target_table_attr_name}=\"", $s_target_table);
                            $a_target_parse = explode('"', $a_target_parse[1]);
                            $s_target_table_attr_value = $a_target_parse[0];

                            if ('row-count' === $s_target_table_attr_name) $a_theads[$th] = $s_target_table_attr_value;
                            else {
                                $s_target_table_attr_value_index = $formula[3];
                                $a_target_table_attr_values = explode(',', $s_target_table_attr_value);
                                if ($a_target_table_attr_values[$s_target_table_attr_value_index]) $a_theads[$th] = $a_target_table_attr_values[$s_target_table_attr_value_index];
                            }
                            $a_attr['thead'] = implode(',', $a_theads);
                        }
                    }
                }
            }
        }
    }

    if (isset($a_attr['row-count'])) {
        if (-1 < strpos($a_attr['row-count'], 'table|')) {
            $formula = explode('|', $a_attr['row-count']);

            $s_target_table_id = $formula[1];
            global $wpdb;
            $s_target_table = $wpdb->get_var($wpdb->prepare("SELECT `description` FROM {$wpdb->prefix}frm_fields WHERE `description` LIKE %s", '%id="' . $s_target_table_id . '"%'));
            if ($s_target_table) {
                $s_target_table_attr_name = $formula[2];
                if (-1 < strpos($s_target_table, "{$s_target_table_attr_name}=")) {
                    $a_target_parse = explode("{$s_target_table_attr_name}=\"", $s_target_table);
                    $a_target_parse = explode('"', $a_target_parse[1]);
                    $s_target_table_attr_value = $a_target_parse[0];

                    if ('row-count' === $s_target_table_attr_name) $a_attr['row-count'] = $s_target_table_attr_value;
                    else {
                        $s_target_table_attr_value_index = $formula[3];
                        $a_target_table_attr_values = explode(',', $s_target_table_attr_value);
                        if ($a_target_table_attr_values[$s_target_table_attr_value_index]) $a_attr['row-count'] = $a_target_table_attr_values[$s_target_table_attr_value_index];
                    }
                }
            }
        }
    }

    if (isset($a_attr['tbody'])) {
        if (-1 < strpos($a_attr['tbody'], 'table|')) {
            $a_tbodies = explode(',', $a_attr['tbody']);
            for ($td = 0; $td < count($a_tbodies); $td++) {
                if (str_starts_with($a_tbodies[$td], 'table|')) {
                    $formula = explode('|', $a_tbodies[$td]);

                    $s_target_table_id = $formula[1];
                    global $wpdb;
                    $s_target_table = $wpdb->get_var($wpdb->prepare("SELECT `description` FROM {$wpdb->prefix}frm_fields WHERE `description` LIKE %s", '%id="' . $s_target_table_id . '"%'));
                    if ($s_target_table) {
                        $s_target_table_attr_name = $formula[2];
                        if (-1 < strpos($s_target_table, "{$s_target_table_attr_name}=")) {
                            $a_target_parse = explode("{$s_target_table_attr_name}=\"", $s_target_table);
                            $a_target_parse = explode('"', $a_target_parse[1]);
                            $s_target_table_attr_value = $a_target_parse[0];

                            if ('row-count' === $s_target_table_attr_name) $a_tbodies[$td] = $s_target_table_attr_value;
                            else {
                                $s_target_table_attr_value_index = $formula[3];
                                $a_target_table_attr_values = explode(',', $s_target_table_attr_value);
                                if ($a_target_table_attr_values[$s_target_table_attr_value_index]) $a_tbodies[$td] = $a_target_table_attr_values[$s_target_table_attr_value_index];
                            }
                            $a_attr['tbody'] = implode(',', $a_tbodies);
                        }
                    }
                }
            }
        }
    }
    // table reference different form: end

    $s_attr = '';
    foreach ($a_attr as $attr => $values) $s_attr .= "{$attr} = '{$values}'";
    return "<table {$s_attr}></table>";
});

add_action('admin_menu', function () {
    add_menu_page('Table Generator', 'Table Generator', 'administrator', __FILE__, function () {
        wp_register_script('rbundle-html-table-generator', plugin_dir_url(__FILE__) . 'rbundle-html-table-generator.js?token=' . time(), ['jquery']);
        wp_enqueue_script('rbundle-html-table-generator');
?>
        <div class="wrap">
            <h1>Rbundle HTML Table</h1>
            <div id="dashboard-widgets-wrap">
                <div id="dashboard-widgets" class="metabox-holder">
                    <div class="">
                        <div class="meta-box-sortables">
                            <div id="dashboard_quick_press" class="postbox ">
                                <div class="postbox-header">
                                    <h2 class="hndle ui-sortable-handle">
                                        <span>Rbundle HTML Table Shortcode Generator</span>
                                    </h2>
                                </div>
                                <div class="inside">
                                    <form method="POST" action="<?php echo $_SERVER['REQUEST_URI']; ?>">

                                        <p>
                                            <b>Modify Existing Short Code</b>
                                            <textarea placeholder="Paste existing shortcode here to edit" style="width: 100%;" cols="100" rows="10" id="reverse_formula"></textarea>
                                            <button id="run_reverse_formula">Import Short Code</button>
                                            <i id="reverse_formula_error"></i>
                                        </p>

                                        <hr>
                                        <p><b>Dimensions</b></p>

                                        <p>
                                            <b>1. User Able Import & Export CSV?</b>
                                            <br><input name="user_able_to_import_export_csv" checked type="radio" value="no"> No
                                            <br><input name="user_able_to_import_export_csv" type="radio" value="yes"> Yes
                                            <br><small>don't forget to put formidable-csv shortcode with version="1".</small>
                                        </p>

                                        <p class="number-of-columns">
                                            <b class="step-1">2. Number of Columns?*</b>
                                            <br class="step-1"><input name="number of columns" value="static" type="radio" class="step-1"> Static
                                            <br class="step-1"><input name="number of columns" value="dynamic" disabled type="radio" class="step-1"> Dynamic
                                            <br class="step-2"><input type="text" name="value number of columns" class="step-2">
                                            <br class="step-2">
                                        </p>

                                        <p>
                                            <b>3. User Able to Add Columns?</b>
                                            <br><input name="user_able_to_add_columns" disabled type="radio"> No
                                            <br><input name="user_able_to_add_columns" disabled type="radio"> Yes
                                            <br><small>and delete those added columns.</small>
                                        </p>

                                        <p class="number-of-rows">
                                            <b class="step-1">4. Number of Rows?</b class="step-1">
                                            <br class="step-1"><input name="number of rows" value="static" type="radio" class="step-1"> Static
                                            <br class="step-1"><input name="number of rows" value="dynamic" type="radio" class="step-1"> Dynamic
                                            <br class="step-2"><input type="text" name="value number of rows" class="step-2">
                                        </p>

                                        <p class="user-able-add-rows">
                                            <b class="step-1">5. User Able to Add Rows?</b class="step-1">
                                            <br class="step-1"><input name="user_able_to_add_rows" type="radio" checked value="no" class="step-1"> No
                                            <br class="step-1"><input name="user_able_to_add_rows" type="radio" value="yes" class="step-1"> Yes
                                            <br class="step-1"><small class="step-1">and delete those added columns.</small class="step-1">
                                        </p>

                                        <p class="user-able-delete-default-rows">
                                            <b class="step-1">6. User Able to Delete Default Rows?</b class="step-1">
                                            <br class="step-1"><input name="user_able_to_delete_default_rows" checked type="radio" value="no" class="step-1"> No
                                            <br class="step-1"><input name="user_able_to_delete_default_rows" type="radio" value="yes" class="step-1"> Yes
                                        </p>

                                        <p>
                                            <b>Value Library</b>
                                            <br>
                                            <textarea style="width: 100%;" rows="5" disabled>
current-year

current-year-minus-## (usage: current-year-minus-3)

current-year-minus-field###

current-year-dash-index

field###-slash-current-year

field###-slash-current-year-minus-index

tax-years-field### (will show: 12/31 dash current year minus index)

today-tax-year-by-field### (will show: if field###/current-year < today then field###/current-year-plus-1 else field###/current-year)

today-tax-year-minus-index-by-field### (will show like above but the year number will be deducted by row number)

TY-dash-index (will show: TY-2)

field###

field###+field###-field###*field###

date-picker

index

index-read-only

dropdown:option-1|option 2|option3

dropdown:|option-1|option 2 <== without initial value

dropdown:|option-1|other <== for allow write-in values

zipcode-validation

currency-format

if 5 equals field### then Yes else if field### not-equals field### then field### else if field### equals No then 18 else field###

if 5 equals index-minus-1 then Yes else field###

row-count="table|#anotherTableID|row-count"

tbody="table|#anotherTableID|tbody|4"

thead="table|#anotherTableID|thead|1"
                                            </textarea>
                                        </p>

                                        <p>
                                            <b>7. Table ID</b>
                                            <br><input type="text" class="table-id" placeholder="Generated on submission, not changed by update" style="width: 100%;">
                                        </p>

                                        <hr>
                                        <p><b>Table CSS</b></p>

                                        <hr>
                                        <p>
                                            <b>Please Copy-Paste Following Short Code Generator Result:</b>
                                            <br>
                                        <p id="rbundle_html_table_generated_shortcode"></p>
                                        </p>
                                    </form </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    <?php
    }, '');
});
