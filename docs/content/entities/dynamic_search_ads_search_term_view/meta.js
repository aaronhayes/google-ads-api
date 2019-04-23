module.exports = {
    name: 'DynamicSearchAdsSearchTermView',
    object: {
        search_term: { _type: 'string', _description: 'Search term\n\nThis field is read-only.' },
        headline: {
            _type: 'string',
            _description: 'The dynamically generated headline of the Dynamic Search Ad.\n\nThis field is read-only.',
        },
        resource_name: {
            _type: 'string',
            _description:
                'The resource name of the dynamic search ads search term view.\nDynamic search ads search term view resource names have the form:\n\n\n`customers/{customer_id}/dynamicSearchAdsSearchTermViews/{ad_group_id}~{search_term_fp}~{headline_fp}~{landing_page_fp}~{page_url_fp}`',
        },
        page_url: {
            _type: 'string',
            _description: 'The URL of page feed item served for the impression.\n\nThis field is read-only.',
        },
        landing_page: {
            _type: 'string',
            _description: 'The dynamically selected landing page URL of the impression.\n\nThis field is read-only.',
        },
    },
    methods: ['get', 'list'],
}