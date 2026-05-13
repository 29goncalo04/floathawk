def found_a_deal_message(skin_name, skin_id, skin_price, skin_float, min_value_to_sell_before, max_value_to_sell_before,
                         min_profit_before, max_profit_before, min_profit_percentage_before, max_profit_percentage_before,
                         min_value_to_sell_after, max_value_to_sell_after, min_profit_after, max_profit_after,
                         min_profit_percentage_after, max_profit_percentage_after,
                         prices_filtered, prices_lower_floats_filtered, prices_higher_floats_filtered,
                         min_float_similar_listed, max_float_similar_listed, lowest_prices_for_similar_skins):
    msg = (
        f"🎯 {skin_name}\n"
        f"💵 ${skin_price} • f: {skin_float:.5f}\n\n"
        f"▶ Before comps listed:\n"
        f"  Sell: ${min_value_to_sell_before/100:.2f} – ${max_value_to_sell_before/100:.2f}\n"
        f"  Profit (post tax): ${min_profit_before/100:.2f} – ${max_profit_before/100:.2f} • ({min_profit_percentage_before:.1f}% – {max_profit_percentage_before:.1f}%)\n\n"
        f"▶ After comps listed:\n"
        f"  Sell: ${min_value_to_sell_after/100:.2f} – ${max_value_to_sell_after/100:.2f}\n"
        f"  Profit (post tax): ${min_profit_after/100:.2f} – ${max_profit_after/100:.2f} • ({min_profit_percentage_after:.1f}% – {max_profit_percentage_after:.1f}%)\n\n"
        f"Similar Float: {'  '.join(f'${p:.2f}' for p in prices_filtered)}\n"
        f"Lower Float:   {'  '.join(f'${p:.2f}' for p in prices_lower_floats_filtered)}\n"
        f"Higher Float:  {'  '.join(f'${p:.2f}' for p in prices_higher_floats_filtered)}\n\n"
        f"Comps listed:\n"
        f"{lowest_prices_for_similar_skins}"
    )

    return msg
