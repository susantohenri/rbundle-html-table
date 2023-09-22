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

                                        <p>
                                            <b>Number of Columns?</b>
                                            <br><input type="radio"> Static
                                            <br><input type="radio"> Dynamic
                                        </p>

                                        <p>
                                            <b>User Able to Add Columns?</b>
                                            <br><input type="radio"> No
                                            <br><input type="radio"> Yes
                                            <br><small>and delete those added columns.</small>
                                        </p>

                                        <p>
                                            <b>Number of Rows?</b>
                                            <br><input type="radio"> Static
                                            <br><input type="radio"> Dynamic
                                        </p>

                                        <p>
                                            <b>User Able to Add Rows?</b>
                                            <br><input type="radio"> No
                                            <br><input type="radio"> Yes
                                            <br><small>and delete those added columns.</small>
                                        </p>

                                        <p>
                                            <b>User Able to Delete Default Rows?</b>
                                            <br><input type="radio"> No
                                            <br><input type="radio"> Yes
                                        </p>

                                        <p>
                                            <b>Value Library</b>
                                            <br>
                                            <textarea style="width: 100%;" rows="5">
row-count

field###

tax-years-field###

current-year-dash-index

date-picker
                                            </textarea>
                                        </p>

                                        <p>
                                            <b>Table ID</b>
                                            <br><input type="text" placeholder="Generated on submission, not changed by update" style="width: 100%;">
                                        </p>

                                        <hr>
                                        <p><b>Table CSS</b></p>

                                        <hr>
                                        <p>
                                            <b>Please Copy-Paste Following Short Code Generator Result:</b>
                                            <br>[rbundle-html-table thead=",,`Tax Years`,`Federal Income Tax Form`,`Legal Entity`,`Subject to BBA`," id="t3" row-count="current-year-minus-field840" tbody=",current-year-dash-index,tax-years-field238,field237,field246, N/A,trash"]
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
