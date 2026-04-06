import 'dart:convert';
import 'package:http/http.dart' as http;

void main() async {
  final url = "https://api.openchargemap.io/v3/poi/?output=json&countrycode=IN&maxresults=10&key=6e78df7e-e6d3-44ee-b911-4b2c43fb8627";
  try {
    final response = await http.get(Uri.parse(url));
    print("Status: \${response.statusCode}");
  } catch (e) {
    print("Error: \$e");
  }
}
