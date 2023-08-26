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

/* USAGE SAMPLE
[
    rbundle-html-table
    header="no,,name"
]
*/
add_shortcode('rbundle-html-table', function ($attr) {
    
    if (!isset ($attr['header'])) return "attribute header required";
    $header = "";
    foreach (explode(',', $attr['header']) as $th) $header .= "<th>{$th}</th>";

    return "
    <table>
        <thead><tr>{$header}</tr></thead>
        <tbody></tbody>
        <tfoot></tfoot>
    </table>
    ";
});