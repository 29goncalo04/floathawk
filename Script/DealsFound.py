def found_a_deal_message(skin_name, skin_id, skin_price, skin_float, min_value_to_sell_before, max_value_to_sell_before,
                         min_profit_before, max_profit_before, min_profit_percentage_before, max_profit_percentage_before,
                         min_value_to_sell_after, max_value_to_sell_after, min_profit_after, max_profit_after,
                         min_profit_percentage_after, max_profit_percentage_after,
                         prices_filtered, prices_lower_floats_filtered, prices_higher_floats_filtered,
                         min_float_similar_listed, max_float_similar_listed, lowest_prices_for_similar_skins):
    msg = (
        f"Skin: {skin_name}\nID: {skin_id}\nPrice: ${skin_price}\nFloat: {skin_float:.5f}\n"
        f"BEFORE fetching similar listed skins:\n     Sell for: [{min_value_to_sell_before/100:.2f}$ - {max_value_to_sell_before/100:.2f}$]\n     Profit (post taxes): [{min_profit_before/100:.2f}$ - {max_profit_before/100:.2f}$]\n     Profit %: [{min_profit_percentage_before:.2f}% - {max_profit_percentage_before:.2f}%]\n"
        f"AFTER fetching similar listed skins:\n     Sell for: [{min_value_to_sell_after/100:.2f}$ - {max_value_to_sell_after/100:.2f}$]\n     Profit (post taxes): [{min_profit_after/100:.2f}$ - {max_profit_after/100:.2f}$]\n     Profit %: [{min_profit_percentage_after:.2f}% - {max_profit_percentage_after:.2f}%]\n"
        f"Prices without outliers:  {prices_filtered}\n"
        f"Prices for lower floats: {prices_lower_floats_filtered}\n"
        f"Prices for higher floats: {prices_higher_floats_filtered}\n"
        f"Similar listed skins:\n"
        f"{lowest_prices_for_similar_skins}"
    )

    return msg
