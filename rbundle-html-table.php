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
    'thead' => ',,`Tax Years`,`Subject to BBA`,',
    /*
        not mandatory fields:
        'id' => 'set_unique_id_here',
        'row-count' => 3,
        'tbody' => ',,`Tax Years`,field1480,',
        'thead-data-csv' => ',,H38,I38,J38,K38',
        'tbody-data-csv' => ',,G39,H39,I39,J39',
     */
]);

add_shortcode('rbundle-html-table', function ($a_attr) {
    // return json_encode($a_attr);
    foreach (RBUNDLE_HTML_TABLE_ATTRIBUTES as $required_attr => $sample) {
        if (!isset($a_attr[$required_attr])) return "please set table {$required_attr} by setting shortcode attribute " . $required_attr . '="' . $sample . '"';
    }
    $a_attr['row-count'] = isset($a_attr['row-count']) ? $a_attr['row-count'] : 0;

    $a_attr['class'] = 'table rbundle-html-table';

    $s_attr = '';
    foreach ($a_attr as $attr => $values) $s_attr .= "{$attr} = '{$values}'";

    wp_register_style('datatables', 'https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css');
    wp_enqueue_style('datatables');

    wp_register_script('datatables', 'https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js');
    wp_enqueue_script('datatables');

    wp_register_style('rbundle-html-table', plugin_dir_url(__FILE__) . 'rbundle-html-table.css?token=' . time());
    wp_enqueue_style('rbundle-html-table');

    wp_register_script('rbundle-html-table', plugin_dir_url(__FILE__) . 'rbundle-html-table.js?token=' . time(), ['jquery']);
    wp_enqueue_script('rbundle-html-table');

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
                                        <hr>
                                        <p><b>Dimensions</b></p>

                                        <p class="number-of-columns">
                                            <b class="step-1">1. Number of Columns?*</b>
                                            <br class="step-1"><input name="number of columns" value="static" type="radio" class="step-1"> Static
                                            <br class="step-1"><input name="number of columns" value="dynamic" disabled type="radio" class="step-1"> dynamic
                                            <br class="step-1"><small class="step-1">
                                                <b>Available Value Library:</b> field###
                                            </small>
                                            <br class="step-2"><input type="text" name="value number of columns" class="step-2">
                                            <br class="step-2">
                                        </p>

                                        <p>
                                            <b>2. User Able to Add Columns?</b>
                                            <br><input name="user_able_to_add_columns" disabled type="radio"> No
                                            <br><input name="user_able_to_add_columns" disabled type="radio"> Yes
                                            <br><small>and delete those added columns.</small>
                                        </p>

                                        <p class="number-of-rows">
                                            <b class="step-1">3. Number of Rows?</b class="step-1">
                                            <br class="step-1"><input name="number of rows" value="static" type="radio" class="step-1"> Static
                                            <br class="step-1"><input name="number of rows" value="dynamic" type="radio" class="step-1"> dynamic
                                            <br class="step-1">
                                            <small class="step-1">
                                                <b>Available Value Library: field###, current-year-dash-index, tax-years-field###</b>
                                            </small>
                                            <br class="step-2"><input type="text" name="value number of rows" class="step-2">
                                            <br class="step-1">
                                        </p>

                                        <p class="user-able-add-rows">
                                            <b class="step-1">4. User Able to Add Rows?</b class="step-1">
                                            <br class="step-1"><input name="user_able_to_add_rows" type="radio" checked value="no" class="step-1"> No
                                            <br class="step-1"><input name="user_able_to_add_rows" type="radio" value="yes" class="step-1"> Yes
                                            <br class="step-1"><small class="step-1">and delete those added columns.</small class="step-1">
                                        </p>

                                        <p class="user-able-delete-default-rows">
                                            <b class="step-1">5. User Able to Delete Default Rows?</b class="step-1">
                                            <br class="step-1"><input name="user_able_to_delete_default_rows" checked type="radio" value="no" class="step-1"> No
                                            <br class="step-1"><input name="user_able_to_delete_default_rows" type="radio" value="yes" class="step-1"> Yes
                                        </p>

                                        <p>
                                            <b>Value Library</b>
                                            <br>
                                            <textarea style="width: 100%;" rows="5" disabled>
current-year-minus-field###

field###

tax-years-field###

current-year-dash-index

date-picker
                                            </textarea>
                                        </p>

                                        <p>
                                            <b>6. Table ID</b>
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
