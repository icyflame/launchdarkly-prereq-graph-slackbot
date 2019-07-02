const graphviz = require('graphviz');
const {
    transform_flag_name,
} = require('./launchdarkly_api_call')

const gen_digraph = ({ flag_items_with_prereqs, flat_mapping }) => {
    const g = graphviz.digraph('prerequisites');

    flag_items_with_prereqs.forEach(({ variations, key, environments }) => {
        const offVariation = variations.filter(variation => variation.value === environments.production.offVariation)
        const flagName = transform_flag_name(key);
        const boxLabel = [ flagName, '' ];

        if (offVariation.length >= 1) {
            boxLabel.push(`Off Variation = ${offVariation[0].value}, ${offVariation[0].name}`)
        }

        g.addNode(flagName, {
            label: boxLabel.join('\n'),
            shape: 'box',
            color: environments.production.on ? '#BAFFB0' : '#FF818F',
            style: 'filled',
        })
    });

    flat_mapping.forEach(({ key, depends_on }) => {
        g.addEdge(
            transform_flag_name(key),
            transform_flag_name(depends_on.key),
            { label: `variation ${depends_on.variation}` },
        )
    });

    return { digraph: g }
}

module.exports = {
    gen_digraph,
}
