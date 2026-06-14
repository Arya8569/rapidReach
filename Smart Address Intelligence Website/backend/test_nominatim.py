import requests

def test_query(query):
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": query,
        "format": "json",
        "limit": 1,
        "addressdetails": 1
    }
    headers = {
        "User-Agent": "SmartAddressIntelligence/1.0"
    }
    try:
        response = requests.get(url, params=params, headers=headers)
        data = response.json()
        print(f"Query: '{query}' -> Success: {bool(data)}")
        if data:
            print(f"  Result: {data[0].get('display_name')}")
    except Exception as e:
        print(f"Error: {e}")

queries = [
    "Dutta Meghe College of Engineering Airoli Navi Mumbai",
    "Datta Meghe College of Engineering Airoli Navi Mumbai",
    "College of Engineering Airoli",
    "Engineering College Airoli"
]

with open("results.txt", "w") as f:
    f.write("--- Testing Nominatim Queries ---\n")
    for q in queries:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": q,
            "format": "json",
            "limit": 1,
            "addressdetails": 1
        }
        headers = {
            "User-Agent": "SmartAddressIntelligence/1.0"
        }
        try:
            response = requests.get(url, params=params, headers=headers)
            data = response.json()
            f.write(f"Query: '{q}' -> Success: {bool(data)}\n")
            if data:
                f.write(f"  Result: {data[0].get('display_name')}\n")
        except Exception as e:
            f.write(f"Error: {e}\n")