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
    'id' => 'set_unique_id_here'
    , 'header' => ',,Tax Years,Subject to BBA,'
]);

add_shortcode('rbundle-html-table', function ($a_attr) {
    // return json_encode($a_attr);
    foreach (RBUNDLE_HTML_TABLE_ATTRIBUTES as $required_attr => $sample) {
        if (!isset ($a_attr[$required_attr])) return 'please set table id by setting shortcode attribute ' . $required_attr . '="' . $sample . '"';
    }

    $a_attr['class'] = 'table rbundle-html-table';

    $s_attr = '';
    foreach ($a_attr as $attr => $values) $s_attr .= "{$attr} = '{$values}'";

    wp_register_style('datatables', 'https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css');
    wp_enqueue_style('datatables');

    wp_register_script('datatables', 'https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js');
    wp_enqueue_script('datatables');

    wp_register_script('rbundle-html-table', plugin_dir_url(__FILE__) . 'rbundle-html-table.js?token=' . time(), array('jquery'));
    wp_enqueue_script('rbundle-html-table');

    return "<table {$s_attr}></table>";
});