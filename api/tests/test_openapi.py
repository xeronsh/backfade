from export_openapi import stable_openapi


def test_openapi_validation_descriptions_are_stable():
    schema = stable_openapi()
    descriptions = [
        operation["responses"]["422"]["description"]
        for path_item in schema["paths"].values()
        for operation in path_item.values()
        if isinstance(operation, dict) and "422" in operation.get("responses", {})
    ]
    assert descriptions
    assert set(descriptions) == {"Unprocessable Content"}
