const graphviz = require('graphviz');
const {
    transform_flag_name,
} = require('./launchdarkly_api_call')

const gen_digraph = ({ flag_items_with_prereqs, flat_mapping }) => {
    const g = graphviz.digraph('prerequisites');

    flag_items_with_prereqs.forEach(({ key }) => {
        g.addNode(transform_flag_name(key))
    });

    flat_mapping.forEach(({ key, depends_on }) => {
        g.addEdge(
            transform_flag_name(key),
            transform_flag_name(depends_on.key),
        )
    });

    return { digraph: g }
}

module.exports = {
    gen_digraph,
}
