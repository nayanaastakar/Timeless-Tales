from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class CataloguePagination(PageNumberPagination):
    page_size = 24
    page_size_query_param = "size"
    max_page_size = 100
    page_query_param = "page"

    def get_page_number(self, request, paginator):
        try:
            return max(1, int(request.query_params.get(self.page_query_param, "0")) + 1)
        except ValueError:
            return 1

    def get_paginated_response(self, data):
        return Response({
            "content": data,
            "totalElements": self.page.paginator.count,
            "totalPages": self.page.paginator.num_pages,
            "number": self.page.number - 1,
            "size": self.get_page_size(self.request),
        })
