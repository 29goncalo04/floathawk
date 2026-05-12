export const gridVariants = {
    hidden: {},
    visible: {
        transition: {
        staggerChildren: 0.5,
        },
    },
    };

export const cardVariants = {
    hidden: {
        opacity: 0,
        x: -500,
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
        type: "spring",
        stiffness: 80,
        damping: 10,
        duration: 0.5,
        },
    },
};
