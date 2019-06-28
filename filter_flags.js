const _ = require('lodash');

const keep_interested_flags = ({ flag_items_with_prereqs, flat_mapping, wantFlags }) => {
    if (wantFlags.length > 0) {
        const flagsWithPrereqs = flag_items_with_prereqs.map(f => f.key)

        const intersection = wantFlags.filter((wantFlag) => _.indexOf(flagsWithPrereqs, wantFlag) >= 0)

        if (intersection.length === 0) {
            return {
                filtered_flag_items: [],
                filtered_flat_mapping: [],
            }
        }

        /**
        flat_mapping = [
            {
                key: ...,
                depends_on: {
                    key: ...,
                    variation: ...,
                },
            },
        ]
        **/

        const filterWantFlags = (flat_mapping, wantFlags, call_count) => {
            if (flat_mapping.length === 0 || wantFlags === 0 || call_count > 10) {
                return []
            }

            const wantMappingFn = flag => (_.indexOf(wantFlags, flag.key) >= 0 || _.indexOf(wantFlags, flag.depends_on.key) >= 0)

            // We want these relations because they are directly related
            const want = flat_mapping.filter(wantMappingFn)

            // Get all the relations that we just discarded
            const remaining = _.reject(flat_mapping, wantMappingFn)

            // Find all the new flags that have now become "wanted" because their parents / children
            // got included in the list
            const newWantedFlagsFull = _.uniq(_.flatten(want.map(f => ([f.key, f.depends_on.key]))), f => _.indexOf(wantFlags, f) >= 0)

            const newWantFlags = _.reject(newWantedFlagsFull, f => _.indexOf(wantFlags, f) >= 0)

            console.log(`call_count: ${call_count}, start: ${flat_mapping.length}, wantFlags: ${wantFlags.length}, select: ${want.length}, remain: ${remaining.length}, newFlags: ${newWantFlags.length}`)

            // Return the direct relations and the relations for every flag that just became
            // "wanted"
            return [...want, ...filterWantFlags(remaining, newWantFlags, call_count+1)]
        }

        console.log(`start: ${flat_mapping.length}; wantFlags: ${wantFlags.length}, ${wantFlags}`)

        const filtered_flat_mapping = filterWantFlags(flat_mapping, wantFlags, 0)

        const filteredAllFlagsWanted = _.uniq(_.flatten(filtered_flat_mapping.map(f => [f.key, f.depends_on.key])))

        const filtered_flag_items = flag_items_with_prereqs.filter(flag => _.indexOf(filteredAllFlagsWanted, flag.key) >= 0)

        return { filtered_flag_items, filtered_flat_mapping }
    }

    return {
        filtered_flag_items: flag_items_with_prereqs,
        filtered_flat_mapping: flat_mapping,
    }
}

module.exports = {
    keep_interested_flags,
}
